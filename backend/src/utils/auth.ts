import { Request, Response } from "express"
import jwt from "jsonwebtoken"

// Campi da inserire nell'access token
export interface User {
IdDip: number
username: string
ruolo: "admin" | "user" 
}

const JWT_SECRET = "foo"
const COOKIE_NAME = "vuepost-access-token"

export const setUser = (req: Request, res: Response, user: any) => {
    const accessToken = jwt.sign(user, JWT_SECRET,{expiresIn:"1 day"})
    res.cookie(COOKIE_NAME, accessToken, {
        maxAge:86400000, //1 giorno in millisecondi 
        httpOnly:true,
        sameSite: "strict",
         //secure: true
    })
}
/**
* Decodifica e verifica l'access token, restituendo l'utente.
* Usato per verificare se l'utente ha effettuato il login.
*/
export const getUser = (req: Request, res: Response) => {
    const accessToken = req.cookies[COOKIE_NAME]
    if(!accessToken) return null
    try {
        const user = jwt.verify(accessToken, JWT_SECRET)
        return user
    }catch{
        return null
    }
}

/**
* Cancella il cookie contente l'access token.
* Usato per effettuare il logout.
*/
export const unsetUser = (req: Request, res: Response) => {
    res.clearCookie(COOKIE_NAME)
}