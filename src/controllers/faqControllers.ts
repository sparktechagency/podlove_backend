import Faq from "@models/faqModel";
import to from "await-to-ts";
import { NextFunction, Request, Response } from "express";
import createError from "http-errors";
import { StatusCodes } from "http-status-codes";

const create = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { question, answer } = req.body;
  const faq = await Faq.create({ question, answer });
  return res.status(StatusCodes.CREATED).json({ success: true, message: "Success", data: faq });
};

const get = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const faqs = await Faq.find();
  if (faqs.length === 0)
    return res.status(StatusCodes.OK).json({ success: true, message: "No FAQ found", data: { faqs: [] } });
  return res.status(StatusCodes.OK).json({ success: true, message: "Success", data: faqs });
};

const update = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const id = req.params.id;
  const { question, answer } = req.body;
  if (!question || !answer) return next(createError(StatusCodes.BAD_REQUEST, "At least one field should be updated."));
  const faq = await Faq.findByIdAndUpdate(id, {question: question, answer: answer}, {new: true});
  if (!faq) throw createError(StatusCodes.NOT_FOUND, "Faq Not Found");
  return res.status(StatusCodes.OK).json({ success: true, message: "Success", data: faq });
};

const remove = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const id = req.params.id;
  const faq = await Faq.findByIdAndDelete(id);
  if (!faq) throw createError(StatusCodes.NOT_FOUND, "Faq Not Found");
  res.status(StatusCodes.OK).json({ success: true, message: "Success", data: {} });
};

const FaqController = {
  create,
  get,
  update,
  remove,
};
export default FaqController;
