import { Request, Response } from 'express';
import { BusinessSetting } from '../models/BusinessSetting.js';
import { logAudit } from '../middleware/audit.js';

export const getSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    let settings = await BusinessSetting.findOne();
    if (!settings) {
      settings = await BusinessSetting.create({});
    }
    res.status(200).json({ success: true, settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error fetching settings.' });
  }
};

export const updateSettings = async (req: Request, res: Response): Promise<void> => {
  try {
    let settings = await BusinessSetting.findOne();
    if (!settings) {
      settings = new BusinessSetting();
    }

    const {
      businessName,
      ownerName,
      phone,
      email,
      address,
      logoUrl,
      upiId,
      payeeName,
      googlePayQrUrl,
      phonePeQrUrl,
      defaultCurrency,
      timezone,
      receiptPrefix,
      termsAndConditions,
    } = req.body;

    if (businessName) settings.businessName = businessName.trim();
    if (ownerName) settings.ownerName = ownerName.trim();
    if (phone) settings.phone = phone.trim();
    if (email) settings.email = email.trim();
    if (address) settings.address = address.trim();
    if (logoUrl !== undefined) settings.logoUrl = logoUrl;
    if (upiId) settings.upiId = upiId.trim();
    if (payeeName) settings.payeeName = payeeName.trim();
    if (googlePayQrUrl !== undefined) settings.googlePayQrUrl = googlePayQrUrl;
    if (phonePeQrUrl !== undefined) settings.phonePeQrUrl = phonePeQrUrl;
    if (defaultCurrency) settings.defaultCurrency = defaultCurrency.trim();
    if (timezone) settings.timezone = timezone.trim();
    if (receiptPrefix) settings.receiptPrefix = receiptPrefix.trim();
    if (termsAndConditions !== undefined) settings.termsAndConditions = termsAndConditions;

    await settings.save();

    await logAudit(req, 'SETTINGS_UPDATED', 'BusinessSetting', settings._id.toString(), {
      businessName: settings.businessName,
      upiId: settings.upiId,
    });

    res.status(200).json({ success: true, message: 'Settings updated successfully.', settings });
  } catch (error: any) {
    res.status(500).json({ success: false, message: error.message || 'Error updating settings.' });
  }
};

