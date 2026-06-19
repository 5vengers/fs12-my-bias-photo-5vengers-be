import { exchangeService } from '../services/exchangeService.js';

const create = async (req, res) => {
  const { itemId } = req.validated.params;
  const { offeredCardId } = req.validated.body;

  const result = await exchangeService.create({
    proposerId: req.user.userId,
    marketItemId: itemId,
    offeredCardId,
  });

  return res.status(201).json({ success: true, data: result });
};

const findSent = async (req, res) => {
  const result = await exchangeService.findSent(req.user.userId);
  return res.json({ success: true, data: result });
};

const findReceived = async (req, res) => {
  const result = await exchangeService.findReceived(req.user.userId);
  return res.json({ success: true, data: result });
};

const approve = async (req, res) => {
  const { exchangeId } = req.validated.params;

  const result = await exchangeService.approve({
    exchangeId,
    sellerId: req.user.userId,
  });

  return res.json({ success: true, data: result });
};

const reject = async (req, res) => {
  const { exchangeId } = req.validated.params;

  const result = await exchangeService.reject({
    exchangeId,
    sellerId: req.user.userId,
  });

  return res.json({
    success: true,
    data: result,
  });
};

const cancel = async (req, res) => {
  const { exchangeId } = req.validated.params;

  const result = await exchangeService.cancel({
    exchangeId,
    proposerId: req.user.userId,
  });

  return res.json({
    success: true,
    data: result,
  });
};

export const exchangeController = {
  create,
  findSent,
  findReceived,
  approve,
  reject,
  cancel,
};
