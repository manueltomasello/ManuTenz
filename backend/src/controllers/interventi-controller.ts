import { Request, Response, } from 'express';
import { connection } from '../utils/db';

//adattate al pool
export async function getInterventi(req: Request, res: Response) {
    const conn = await connection.promise().getConnection();
    try {
        // JSON_ARRAYGG è supportato nelle versioni pùu recenti di MySql, seguire le istruzioni
        const query = `
            SELECT
                i.*,
                (SELECT JSON_ARRAYAGG(d.IdDip)
                    FROM interventi_dipendenti d WHERE d.IntId = i.IntId) AS DipendentiJson,
                (SELECT JSON_ARRAYAGG(e.IdFornitore)
                    FROM interventi_esterni e WHERE e.IntId = i.IntId) AS FornitoriEsterniJson,
                (SELECT JSON_ARRAYAGG(JSON_OBJECT('ArtId', a.ArtId, 'qta', a.qta))
                    FROM interventi_articoli a WHERE a.IntId = i.IntId) AS ArticoliUsatiJson
            FROM interventi i
            ORDER BY i.IntId DESC; 
        `;

        const [results] = await conn.query<any[]>(query);
        const finalResults = results.map(row => {
            const dipendenti = row.DipendentiJson ? JSON.parse(row.DipendentiJson) : [];
            const fornitori = row.FornitoriEsterniJson ? JSON.parse(row.FornitoriEsterniJson) : [];
            const articoli = row.ArticoliUsatiJson ? JSON.parse(row.ArticoliUsatiJson) : [];
            delete row.DipendentiJson;
            delete row.FornitoriEsterniJson;
            delete row.ArticoliUsatiJson;

            return {
                ...row,
                Dipendenti: dipendenti,
                FornitoriEsterni: fornitori,
                ArticoliUsati: articoli
            };
        });

        res.json(finalResults);

    } catch (err: any) {
        console.error("Errore nel recupero degli interventi con JSON:", err); // con err ho un Log più dettagliato
        res.status(500).json({
            message: 'Errore nel recupero degli interventi',
            error: err.message
        });
    }finally {
        conn.release(); 
    }
}
// per campo fattura  
export async function getInterventiEsterni(req: Request, res: Response) {
    const conn = await connection.promise().getConnection();
    try {
        const [results] = await conn.query(
            `SELECT i.IntId
             FROM interventi i
             LEFT JOIN interventi_esterni ie ON i.IntId = ie.IntId
             WHERE ie.IdFornitore IS NOT NULL and i.ValidataMan = '0'
             ORDER BY i.IntId DESC`
        );
        res.json(results);
    } catch (err) {
        res.status(500).json({ message: 'Errore', error: err });
    } finally {
        conn.release();
    }
}
export async function createIntervento(req: Request, res: Response) {
    const {ManId, NomeRisorsaInt, DataIntPrev, DataIntEff, TmpInt, EsitoMan, noteIntervento, TipoGuastoId, Dipendenti, FornitoriEsterni, ArticoliUsati,
    } = req.body;
    const conn = await connection.promise().getConnection();

    try {
        const year = new Date().getFullYear().toString().slice(-2);
        const [lastIdResult] = await conn.query(
            'SELECT IntId FROM interventi WHERE IntId LIKE ? ORDER BY IntId DESC LIMIT 1',
            [`INT-${year}-%`]
        );

        let newProgressivo = '00001';
        if ((lastIdResult as any[]).length > 0) {
            const lastId = (lastIdResult as any)[0].IntId;
            const lastNumber = parseInt(lastId.split('-')[2], 10);
            newProgressivo = (lastNumber + 1).toString().padStart(5, '0');
        }

        const newIntId = `INT-${year}-${newProgressivo}`;

        await conn.execute(
            `INSERT INTO interventi (
                IntId, ManId, NomeRisorsaInt, DataIntPrev, DataIntEff, OraInizio, OraFIne, TmpInt,
                EsitoMan, noteIntervento, TipoGuastoId, OriginInt
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [
                newIntId,
                ManId, 
                NomeRisorsaInt, 
                DataIntPrev,
                DataIntEff || null,
                '08:00:00',
                '12:00:00',
                TmpInt || null,
                EsitoMan ? 1 : 0,
                noteIntervento || null,
                TipoGuastoId || null,
                0 
            ]
        );

        // Inserimento in interventi_dipendenti 
        if (Dipendenti?.length > 0) {
            const dipendentiValues = Dipendenti.map((dipId: number) => [newIntId, dipId]);
            await conn.query(
                'INSERT INTO interventi_dipendenti (IntId, IdDip) VALUES ?',
                [dipendentiValues] // Inserimento multiplo per efficienza
            );
        }

        // Inserimento in interventi_esterni 
        if (FornitoriEsterni?.length > 0) {
             const fornitoriValues = FornitoriEsterni.map((fornId: string) => [newIntId, fornId]);
             await conn.query(
                'INSERT INTO interventi_esterni (IntId, IdFornitore) VALUES ?',
                [fornitoriValues] // Inserimento multiplo per efficienza
             );
        }

        // Inserimento in interventi_articoli 
        if (ArticoliUsati?.length > 0) {
            const articoliValues = ArticoliUsati.map((articolo: { ArtId: number, qta: number }) => [newIntId, articolo.ArtId, articolo.qta]);
            await conn.query(
                'INSERT INTO interventi_articoli (IntId, ArtId, qta) VALUES ?',
                [articoliValues] // Inserimento multiplo per efficienza
            );
        }

        
        res.status(201).json({
            message: 'Intervento creato con successo',
            IntId: newIntId,
        });

    } catch (error: any) {
        console.error('Errore durante la creazione intervento:', error);
        res.status(500).json({
            message: 'Errore nel processo di creazione',
            error: error.message,
            details: error.sqlMessage // Dettagli sull'errore SQL
        });
    }finally {
        conn.release(); 
    }
}
export async function updateIntervento(req: Request, res: Response) {
    const { id } = req.params; // ID dell'intervento da URL /INT-25-00001
    const {
        ManId,
        NomeRisorsaInt,
        DataIntPrev,
        DataIntEff,
        TmpInt,
        EsitoMan,
        noteIntervento,
        TipoGuastoId,
        Dipendenti,       
        FornitoriEsterni, 
        ArticoliUsati     
    } = req.body;
    const conn = await connection.promise().getConnection();

    try {
        // INIZIO TRANSAZIONE
        await conn.beginTransaction();
        await conn.query(
            `UPDATE interventi SET
                ManId = COALESCE(?, ManId),
                NomeRisorsaInt = COALESCE(?, NomeRisorsaInt),
                DataIntPrev = COALESCE(?, DataIntPrev),
                DataIntEff = COALESCE(?, DataIntEff),
                TmpInt = COALESCE(?, TmpInt ),
                EsitoMan = COALESCE(?, EsitoMan),
                noteIntervento = COALESCE(?, noteIntervento),
                TipoGuastoId = COALESCE(?, TipoGuastoId)
            WHERE IntId = ?`,
            [
                ManId,
                NomeRisorsaInt,
                DataIntPrev,
                DataIntEff || null,
                TmpInt || null,
                EsitoMan !== undefined ? EsitoMan ? 1 : 0 : undefined,
                noteIntervento || null,
                TipoGuastoId || null, id
            ]
        );

        
        const campiInterventoDaAggiornare: { [key: string]: any } = {};
        // Eseguo l'UPDATE solo se c'è almeno un campo da aggiornare
        if (Object.keys(campiInterventoDaAggiornare).length > 0) {
            await conn.query('UPDATE interventi SET ? WHERE IntId = ?', [campiInterventoDaAggiornare, id]);
        }

        // Aggiorno interventi_dipendenti
        if (Dipendenti !== undefined) {
            // Prima canc tutte le ass esistenti per questo intervento
            await conn.query('DELETE FROM interventi_dipendenti WHERE IntId = ?', [id]);

            // nuove associazioni
            if (Array.isArray(Dipendenti) && Dipendenti.length > 0) {
                const dipendentiValues = Dipendenti
                    .filter(dipId => dipId != null && Number(dipId) > 0)
                    .map(dipId => [id, Number(dipId)]); 

                if (dipendentiValues.length > 0) {
                    await conn.query('INSERT INTO interventi_dipendenti (IntId, IdDip) VALUES ?', [dipendentiValues]);
                }
            }
        }

        // Aggiorno interventi_articoli 
        if (ArticoliUsati !== undefined) {

            await conn.query('DELETE FROM interventi_articoli WHERE IntId = ?', [id]);

            // Poi inserisco i nuovi articoli 
            if (Array.isArray(ArticoliUsati) && ArticoliUsati.length > 0) {
                const articoliValues = ArticoliUsati
                    .filter(a => a != null && a.ArtId != null && Number(a.ArtId) > 0 && a.qta != null && Number(a.qta) > 0) 
                    .map(a => [id, Number(a.ArtId), Number(a.qta)]); 
                if (articoliValues.length > 0) {
                    await conn.query('INSERT INTO interventi_articoli (IntId, ArtId, qta) VALUES ?', [articoliValues]);
                }
            }
        }

        if (FornitoriEsterni !== undefined) {
            await conn.query('DELETE FROM interventi_esterni WHERE IntId = ?', [id]);
            if (Array.isArray(FornitoriEsterni) && FornitoriEsterni.length > 0) {
                const fornitoriValues = FornitoriEsterni
                    .filter(fornId => fornId != null && String(fornId).trim() !== '') 
                    .map(fornId => [id, String(fornId).trim()]); 
                if (fornitoriValues.length > 0) {
                    await conn.query('INSERT INTO interventi_esterni (IntId, IdFornitore) VALUES ?', [fornitoriValues]);
                }
            }
        }

        
        await conn.commit();

        res.status(200).json({ message: 'Intervento aggiornato con successo' });

    } catch (error: any) {
        await conn.rollback();

        console.error("Errore durante l'aggiornamento dell'intervento:", error); 
        res.status(500).json({
            message: 'Errore durante l\'aggiornamento dell\'intervento.',
        });
    }finally {
        conn.release(); 
    }
}
export async function deleteIntervento(req: Request, res: Response) {
    const { id } = req.params;
    const pool = connection.promise(); 
    const conn = await pool.getConnection(); 

    try {
        const [checkResult]: any = await conn.query(
            'SELECT IntId FROM interventi WHERE IntId = ?',
            [id]
        );

        if (checkResult.length === 0) {
            res.status(404).json({ message: 'Intervento non trovato' });
            conn.release(); 
            return;
        }

        await conn.beginTransaction();
        await conn.execute('DELETE FROM interventi_dipendenti WHERE IntId = ?', [id]);
        await conn.execute('DELETE FROM interventi_esterni WHERE IntId = ?', [id]);
        await conn.execute('DELETE FROM interventi_articoli WHERE IntId = ?', [id]);
        await conn.execute('DELETE FROM fatture WHERE IntId = ?', [id]);

        const [deleteResult]: any = await conn.execute(
            'DELETE FROM interventi WHERE IntId = ?',
            [id]
        );

        if (deleteResult.affectedRows === 0) {
            await conn.rollback();
            res.status(404).json({ message: 'Intervento non trovato' });
            conn.release();
            return;
        }

        await conn.commit();
        res.json({ message: 'Intervento eliminato con successo' });

    } catch (error: any) {
        try {
            await conn.rollback(); 
        } catch (rollbackError) {
            console.error('Rollback fallito:', rollbackError);
        }
        res.status(500).json({ message: "Errore nell'eliminazione", error: error.message });
    } finally {
        conn.release(); 
    }
}
export async function getInterventoById(req: Request, res: Response) {
    const interventoId = req.params.id as string; 

    // Validazione
    if (!interventoId) {
        return res.status(400).json({ message: 'ID intervento mancante.' });
    }

    const conn = await connection.promise().getConnection();
    try {

        const query = `
            SELECT
                i.*,
                (SELECT JSON_ARRAYAGG(d.IdDip)
                    FROM interventi_dipendenti d WHERE d.IntId = i.IntId) AS DipendentiJson,
                (SELECT JSON_ARRAYAGG(e.IdFornitore)
                    FROM interventi_esterni e WHERE e.IntId = i.IntId) AS FornitoriEsterniJson,
                (SELECT JSON_ARRAYAGG(JSON_OBJECT('ArtId', a.ArtId, 'qta', a.qta))
                    FROM interventi_articoli a WHERE a.IntId = i.IntId) AS ArticoliUsatiJson
            FROM interventi i
            WHERE i.IntId = ?; 
        `;

        const [results] = await conn.query<any[]>(query, [interventoId]); // Passa la stringa

        if (results.length === 0) {
            return res.status(404).json({ message: `Intervento con ID ${interventoId} non trovato.` });
        }

        const rawIntervento = results[0];

        const dipendenti = rawIntervento.DipendentiJson ? JSON.parse(rawIntervento.DipendentiJson) : [];
        const fornitori = rawIntervento.FornitoriEsterniJson ? JSON.parse(rawIntervento.FornitoriEsterniJson) : [];
        const articoli = rawIntervento.ArticoliUsatiJson ? JSON.parse(rawIntervento.ArticoliUsatiJson) : [];

        const finalIntervento = {
            ...rawIntervento,
            Dipendenti: dipendenti,
            FornitoriEsterni: fornitori,
            ArticoliUsati: articoli
        };

        delete finalIntervento.DipendentiJson;
        delete finalIntervento.FornitoriEsterniJson;
        delete finalIntervento.ArticoliUsatiJson;
        res.json(finalIntervento);

    } catch (err: any) {
        console.error(`Errore nel recupero dell'intervento ${interventoId}:`, err);
        res.status(500).json({
            message: 'Errore durante il recupero dell\'intervento',
            error: err.message
        });
    } finally {
        
            conn.release();
        
    }
}