import { Document, model, Schema } from "mongoose";

export type AboutSchema = Document & {
    text: string,
}

const aboutSchema = new Schema<AboutSchema>({
    text: {
        type: String,
        required: true,
    }
})

const About = model<AboutSchema>("About", aboutSchema);
export default About;