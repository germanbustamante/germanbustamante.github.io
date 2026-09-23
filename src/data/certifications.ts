export interface Certification {
  nameKey: string;
  issuerKey: string;
  dateKey: string;
  descriptionKey: string;
  credentialUrl?: string;
}

export const certifications: Certification[] = [
  {
    nameKey: "certifications.claudeCode.name",
    issuerKey: "certifications.claudeCode.issuer",
    dateKey: "certifications.claudeCode.date",
    descriptionKey: "certifications.claudeCode.description",
    credentialUrl: "https://verify.skilljar.com/c/f5perp2nbo4i",
  },
  {
    nameKey: "certifications.arch.name",
    issuerKey: "certifications.arch.issuer",
    dateKey: "certifications.arch.date",
    descriptionKey: "certifications.arch.description",
  },
  {
    nameKey: "certifications.compose.name",
    issuerKey: "certifications.compose.issuer",
    dateKey: "certifications.compose.date",
    descriptionKey: "certifications.compose.description",
  },
];
