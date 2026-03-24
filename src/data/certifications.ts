export interface Certification {
  nameKey: string;
  issuerKey: string;
  dateKey: string;
  descriptionKey: string;
}

export const certifications: Certification[] = [
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
