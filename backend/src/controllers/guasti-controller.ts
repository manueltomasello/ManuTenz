import { Request, Response } from "express"
import { connection } from "../utils/db"
// IT vuole che i guasti siano siano inseriti nel db dall'admsa (no implementazione)
export async function getGuasti(req: Request, res: Response) {
  connection.execute(
    `SELECT * FROM cause_guasto`,
    [],
    function (err, results) {
      if (err) {
        res.status(500).json({ message: 'Errore nel recupero dei dati', error: err });
    } else {
        res.json(results);
    }
    }
  )
}
export async function createGuasto(req: Request, res: Response) {
    connection.execute(
      'INSERT INTO cause_guasto(Descrizione) VALUES (?)',
      [ 
        req.body.Descrizione
      ],
      function (err) {
        if (err){
          return res.status(500).json({ message: 'Errore durante l’inserimento',error: err });
        }else{
          res.status(201).json({ message: 'Tipologia di guasto inserita con successo' });
        }
        
      }
    );
} 
export async function updateGuasto(req: Request, res: Response) { 
  connection.execute( 
    `UPDATE cause_guasto 
     SET Descrizione = ?
     WHERE IdGuasto = ?`,
     [
       req.body.Descrizione,  
       req.params.id 
     ],
    function (err, results: any) { 
      if (err) {
        return res.status(500).json({ error: "Errore nell'aggiornamento", details: err });
      }

      if (results.affectedRows === 0) {
        return res.status(404).json({ message: "Nessuna causale di guasto trovata con questo ID" });
      }

      res.status(200).json({ message: "causale di guasto modificata con successo" });
    }
  );
}
export async function deleteGuasto(req: Request, res: Response) {
    connection.execute(
      `DELETE FROM cause_guasto WHERE IdGuasto = ?`,
      [req.params.id],
      function (err) {
        if (err) {
          res.status(500).json({ message: 'Errore nella cancellazione', error: err });
        } else {
          res.status(200).json({ message: 'Causale Guasto eliminata con successo' });
        }
    }
  );
}