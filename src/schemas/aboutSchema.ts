import { Document } from "mongoose"

export type AboutSchema = Document & {
    text: string,
}