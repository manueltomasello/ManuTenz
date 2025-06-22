import { Request, Response } from 'express';
import { connection } from '../utils/db';
import bcrypt from "bcrypt"


export async function getDipendente(req: Request, res: Response) {
  const conn = await connection.promise().getConnection();
  try {
    const [results] = await conn.query(`SELECT * FROM operatore WHERE Abilitato != '0'`);
    res.json(results);
  } catch (err) {
    res.status(500).json({ message: 'Errore nel recupero dei dati', error: err });
  } finally {
    conn.release();
  }
}
export async function createDipendente(req: Request, res: Response) {
  const conn = await connection.promise().getConnection();
  try {

    const { Matricola, NomeDip, CognDip, EmailDip, PassDip, CostoOrario, username, ruolo } = req.body;

    if (!NomeDip || !CognDip || !PassDip) {
        return res.status(400).json({ message: "Campi obbligatori mancanti." });
    }
    const hash = await bcrypt.hash(PassDip, 10); 
    await conn.query(
      `INSERT INTO operatore (Matricola, NomeDip, CognDip, EmailDip, PassDip, CostoOrario, username, ruolo)
       VALUES (?, ?, ?, ?, ?, ? , ?, ? )`,
      [
        Matricola,
        NomeDip,
        CognDip,
        EmailDip || null, 
        hash, 
        CostoOrario,
        username,
        ruolo
      ]
    );
    res.status(201).json({ message: 'Dipendente inserito con successo' });

  } catch (err) {
    console.error("Errore durante l'inserimento del dipendente:", err); 
    res.status(400).json({ message: "Errore: Matricola o altro campo univoco già esistente." });

    res.status(500).json({ message: "Errore durante l'inserimento", });
  } finally {
    if (conn) conn.release();
  }
}
export async function updateDipendente(req: Request, res: Response) {
  const conn = await connection.promise().getConnection();
  try {
    const IdDipToUpdate = req.params.id;
    const {Matricola, NomeDip, CognDip, EmailDip, CostoOrario, username, ruolo, PassDip // Il campo con la nuova password in chiaro, se fornito
    } = req.body;

    const updates: string[] = []; 
    const values: any[] = []; 

    if (Matricola !== undefined) { 
      updates.push("Matricola = ?");
      values.push(Matricola);
    }
    if (NomeDip !== undefined) {
      updates.push("NomeDip = ?");
      values.push(NomeDip);
    }
    if (CognDip !== undefined) {
      updates.push("CognDip = ?");
      values.push(CognDip);
    }
    if (EmailDip !== undefined) {
      updates.push("EmailDip = ?");
      values.push(EmailDip);
    }
     if (CostoOrario !== undefined) {
      updates.push("CostoOrario = ?");
      values.push(CostoOrario);
    }
     if (username !== undefined) {
      updates.push("username = ?");
      values.push(username);
    }
     if (ruolo !== undefined) {
      updates.push("ruolo = ?");
      values.push(ruolo);
    }
   
    if (PassDip && typeof PassDip === 'string' && PassDip.length > 0) {
      const hashedPassword = await bcrypt.hash(PassDip, 10);
      updates.push("PassDip = ?"); 
      values.push(hashedPassword); 
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: "Nessun campo valido fornito per l'aggiornamento." });
    }
    const query = `UPDATE operatore SET ${updates.join(', ')} WHERE IdDip = ?`;
    values.push(IdDipToUpdate);

    const [result]: any = await conn.query(query, values);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: "Nessun dipendente trovato con questo ID." });
    }


    res.json({ message: "Anagrafica Dipendente modificata con successo" });

  } catch (err) {
    console.error("Errore nell'aggiornamento del dipendente:", err); 
    res.status(500).json({ error: "Errore nell'aggiornamento del dipendente"}); 
  } finally {
    if (conn) conn.release();
  }
}
export async function disableDipendente(req: Request, res: Response) {
  const IdDip = req.params.id;
  const conn = await connection.promise().getConnection();

  try {
    // Verifica se il dipendente esiste
    const [check]: any = await conn.query(
      'SELECT IdDip FROM operatore WHERE IdDip = ?',
      [IdDip]
    );

    if (check.length === 0) {
      return res.status(404).json({ message: 'Dipendente non trovato' });
    }

    // Disabilita il dipendente impostando Abilitato = 0
    const [result]: any = await conn.query(
      'UPDATE operatore SET Abilitato = 0 WHERE IdDip = ?',
      [IdDip]
    );

    if (result.affectedRows === 0) {
      return res.status(500).json({ message: 'Errore durante la disabilitazione del dipendente' });
    }

    res.status(200).json({ message: 'Dipendente disabilitato con successo' });

  } catch (err) {
    console.error('Errore nella disabilitazione:', err);
    res.status(500).json({ message: 'Errore interno', error: err });
  } finally {
    conn.release();
  }
}