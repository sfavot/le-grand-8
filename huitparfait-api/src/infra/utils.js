import Joi from 'joi'
import shortid from 'shortid'

export const shortIdSchema = Joi.string().required().pattern(/^[a-zA-Z0-9-_]{7,14}$/)

/** Identifiants utilisateur (shortid ou jeux de données de dev courts, ex. u1). */
export const userIdSchema = Joi.string().required().pattern(/^[a-zA-Z0-9-_]{1,14}$/)

/** Identifiants de groupe en query (même tolérance que userId). */
export const groupIdSchema = userIdSchema

export function generateId() {
    return shortid.generate()
}
