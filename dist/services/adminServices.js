"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const http_status_codes_1 = require("http-status-codes");
const sendMessage = async (req, res, next) => {
    const { isAll, userId, message, medium } = req.body;
    if (typeof isAll !== "boolean" || !message || !medium) {
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({ success: false, message: "Bad Request", data: {} });
    }
    if (isAll === false && !userId) {
        return res.status(http_status_codes_1.StatusCodes.BAD_REQUEST).json({
            success: false,
            message: "Bad Request. User Id required",
            data: {}
        });
    }
    res.status(http_status_codes_1.StatusCodes.OK).json({
        success: true,
        message: "Message Sent Successfully",
        data: {}
    });
};
const AdminServices = { sendMessage };
exports.default = AdminServices;
