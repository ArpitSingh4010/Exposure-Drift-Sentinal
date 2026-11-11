import { Schema, model, Document } from 'mongoose';

export interface ICompanyAddress {
  streetAddress: string;
  buildingLocality: string;
  city: string;
  state: string;
  postalCode: string; // 6-digit Indian PIN code
  country: 'India';
  formattedAddress: string;
  sourceUrl: string;
}

export interface ICompany extends Document {
  companyId: string;
  legalName: string;
  commonName: string;
  parentCompany: string | null;
  insuranceCategory: string;
  irdaiRegistrationNo: string | null;
  officialWebsite: string;
  registeredOffice: ICompanyAddress;
  headquarters: ICompanyAddress;
  guidewireProducts: string[];
  guidewireEvidence: string;
  guidewireSourceUrl: string;
  addressSourceUrl: string;
  lastVerifiedDate: string;
  verificationStatus: 'VERIFIED';
  aliases: string[];
}

const AddressSchema = new Schema<ICompanyAddress>(
  {
    streetAddress: { type: String, required: true },
    buildingLocality: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    postalCode: { type: String, required: true },
    country: { type: String, default: 'India' },
    formattedAddress: { type: String, required: true },
    sourceUrl: { type: String, required: true },
  },
  { _id: false },
);

const CompanySchema = new Schema<ICompany>(
  {
    companyId: { type: String, required: true, unique: true, index: true },
    legalName: { type: String, required: true, index: true },
    commonName: { type: String, required: true },
    parentCompany: { type: String, default: null },
    insuranceCategory: { type: String, required: true },
    irdaiRegistrationNo: { type: String, default: null },
    officialWebsite: { type: String, required: true },
    registeredOffice: { type: AddressSchema, required: true },
    headquarters: { type: AddressSchema, required: true },
    guidewireProducts: { type: [String], default: [] },
    guidewireEvidence: { type: String, required: true },
    guidewireSourceUrl: { type: String, required: true },
    addressSourceUrl: { type: String, required: true },
    lastVerifiedDate: { type: String, required: true },
    verificationStatus: { type: String, default: 'VERIFIED' },
    aliases: { type: [String], default: [] },
  },
  { timestamps: true },
);

CompanySchema.index({ legalName: 'text', commonName: 'text', aliases: 'text' });

export const Company = model<ICompany>('Company', CompanySchema);
