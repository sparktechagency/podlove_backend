import { Document } from "mongoose";

export type TermSchema = Document & {
    text: string;
}