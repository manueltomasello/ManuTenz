import { Router } from 'express';
import * as CrudGuasti from "../controllers/guasti-controller"

const router: Router = Router()

router.get("/api/VisualizzaGuasti", CrudGuasti.getGuasti);
router.post("/api/CreaGuasto", CrudGuasti.createGuasto);
router.put("/api/ModificaGuasto/:id",CrudGuasti.updateGuasto);
router.delete("/api/CancellaGuasto/:id", CrudGuasti.deleteGuasto);



export default router