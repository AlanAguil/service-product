export const QUERY_CONSTANTS = {
  //example query
  findSiteCardsGroupedByPreclassifier: `
        CONCAT(card.preclassifier_code, ' ', card.preclassifier_description) AS preclassifier,
  COUNT(*) AS totalCards,
  card.cardType_name AS methodology,
  card.cardType_color AS color
    `,
};
