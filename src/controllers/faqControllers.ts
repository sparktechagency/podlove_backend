import Faq from "@models/faqModel";
import to from "await-to-ts";
import { NextFunction, Request, Response } from "express";
import createError from "http-errors";
import { StatusCodes } from "http-status-codes";

const create = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const { question, answer } = req.body;
  const [error, faq] = await to(Faq.create({ question, answer }));
  if (error) return next(error);
  res.status(StatusCodes.CREATED).json({ success: true, message: "Success", data: faq });
};

const get = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const [error, faqs] = await to(Faq.find());
  if (error) return next(error);
  if (faqs.length === 0)
    return res.status(StatusCodes.OK).json({ success: true, message: "No FAQ found", data: { faqs: [] } });
  return res.status(StatusCodes.OK).json({ success: true, message: "Success", data: faqs });
};

const update = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const id = req.params.id;
  const { question, answer } = req.body;
  let error, faq;
  if (!question || !answer) {
    return next(createError(StatusCodes.BAD_REQUEST, "At least one field should be updated."));
  }

  [error, faq] = await to(Faq.findById(id));
  if (error) return next(error);
  if (!faq) return next(createError(StatusCodes.NOT_FOUND, "Faq Not Found"));

  faq.question = question || faq.question;
  faq.answer = answer || faq.answer;

  [error] = await to(faq.save());
  if (error) return next(error);

  res.status(StatusCodes.OK).json({ success: true, message: "Success", data: faq });
};

const remove = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
  const id = req.params.id;
  const [error, faq] = await to(Faq.findByIdAndDelete(id));
  if (error) return next(error);
  if (!faq) return next(createError(StatusCodes.NOT_FOUND, "Faq Not Found"));
  res.status(StatusCodes.OK).json({ success: true, message: "Success", data: {} });
};

const FaqController = {
  create,
  get,
  update,
  remove,
};
export default FaqController;
