import type { Request, Response } from "express";
import { register } from "../services/auth/signup.service.js";
import type { ResponseData } from "../types/reqRes.js";
import { sendResponse } from "../utils/responseHandler.js";
import { handleVerifyOtp } from "../services/auth/verifyOtp.service.js";
import { handleResendOtp } from "../services/auth/resendOtp.service.js";
import { handleLogin } from "../services/auth/login.service.js";
import { handleRefreshToken } from "../services/auth/refreshToken.service.js";
import type { Iregister } from "../types/auth.js";

/**
 * @route   POST /signup
 * @desc    Register a new user account
 * @access  Public
 */
export const signup = async (req: Request, res: Response) => {
  const user: Iregister = req.body;
  const result: ResponseData = await register(user);
  sendResponse(res, result);
};

/**
 * @route   POST /verify-otp
 * @desc    verify user otp with db otp
 * @access  Public
 */
export const verifyOtp = async (req: Request, res: Response) => {
  const otpBody = {
    email: req.body.email,
    otp: req.body.otp,
    ip: req.ip || "na",
    userAgent: req.get("User-Agent") || "na",
  };
  const result: ResponseData = await handleVerifyOtp(otpBody);

  if (!result.success) {
    return sendResponse(res, result);
  }

  const { refreshToken, accessToken } = result.data;

  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  result.data = { accessToken };

  return sendResponse(res, result);
};

/**
 * @route   GET /refresh-token
 * @desc    generate new access token using refresh token
 * @access  secure
 */
export const refreshToken = async (req: Request, res: Response) => {
  const { refreshToken } = req.cookies;

  if (!refreshToken) {
    const response: ResponseData = {
      success: true,
      message: "Unauthorize user (refresh token not found)",
      data: null,
      statusCode: 401,
    };
    return sendResponse(res, response);
  }

  const result: ResponseData = await handleRefreshToken(refreshToken);

  if (!result.success) {
    return sendResponse(res, result);
  }

  const { accessToken, newRefreshToken } = result.data;

  res.cookie("refreshToken", newRefreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  result.data = { accessToken };

  return sendResponse(res, result);
};

/**
 * @route   POST /resend-otp
 * @desc    resend otp on register email in case otp expired
 * @access  Public
 */
export const resendOtp = async (req: Request, res: Response) => {
  const { email } = req.body;
  const result: ResponseData = await handleResendOtp(email);
  return sendResponse(res, result);
};

/**
 * @route   POST /login
 * @desc    login to use application
 * @access  Public
 */
export const login = async (req: Request, res: Response) => {
  const loginBody = {
    email: req.body.email,
    password: req.body.password,
    ip: req.ip || "na",
    userAgent: req.get("User-Agent") || "na",
  };
  const result: ResponseData = await handleLogin(loginBody);

  if (!result.success) {
    return sendResponse(res, result);
  }

  const { accessToken, refreshToken } = result.data;
  res.cookie("refreshToken", refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "strict",
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });

  result.data = { accessToken };

  return sendResponse(res, result);
};

/**
 * @route   POST /logout
 * @desc    logout from a particular device
 * @access  secure
 */
export const logout = async (req: Request, res: Response) => {};

/**
 * @route   POST /logout-all
 * @desc    logout from all devices
 * @access  secure
 */
export const logoutAll = async (req: Request, res: Response) => {};
