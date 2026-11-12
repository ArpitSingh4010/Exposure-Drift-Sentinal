import { Router, Request, Response, NextFunction } from 'express';
import { Company } from '../models/Company.js';
import { VERIFIED_INDIAN_INSURERS } from '../seed/indianInsurersData.js';
import { matchIndianInsurer } from '../services/resolution/index.js';

export const companiesRouter = Router();

/**
 * GET /api/companies
 * Returns all verified Indian Guidewire insurance companies.
 */
companiesRouter.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    // Attempt database retrieval, fallback to verified static seed list if DB not seeded
    let companies = await Company.find().sort({ companyId: 1 }).lean().exec();
    if (!companies || companies.length === 0) {
      companies = VERIFIED_INDIAN_INSURERS as any;
    }
    res.json(companies);
  } catch (error) {
    next(error);
  }
});

/**
 * GET /api/companies/:companyId
 * Returns a single verified company by ID.
 */
companiesRouter.get('/:companyId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { companyId } = req.params;
    let company = await Company.findOne({ companyId }).lean().exec();
    if (!company) {
      company = (VERIFIED_INDIAN_INSURERS.find((c) => c.companyId === companyId) as any) ?? null;
    }
    if (!company) {
      res.status(404).json({ error: `Company ${companyId} not found in verified registry` });
      return;
    }
    res.json(company);
  } catch (error) {
    next(error);
  }
});

/**
 * POST /api/companies/match
 * Executes the weighted entity matching algorithm against the verified Indian Guidewire insurer registry.
 * Formula: 0.6 * Name + 0.3 * Address + 0.1 * PIN
 */
companiesRouter.post('/match', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, address, postalCode } = req.body ?? {};

    let registry = await Company.find().lean().exec();
    if (!registry || registry.length === 0) {
      registry = VERIFIED_INDIAN_INSURERS as any;
    }

    const result = matchIndianInsurer({ name, address, postalCode }, registry as any);
    res.json(result);
  } catch (error) {
    next(error);
  }
});

