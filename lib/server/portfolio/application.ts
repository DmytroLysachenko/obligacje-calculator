import {
  createOwnerPortfolio,
  createPortfolioLot,
  createPortfolioLotWithBuyTransaction,
  deleteOwnerLot,
  deleteOwnerPortfolio,
  importOwnerPortfolio,
  toggleOwnerPortfolioSharing,
  updateOwnerLot,
} from './commands';
import {
  exportOwnerPortfolio,
  listOwnerPortfolios,
  listPortfolioLots,
  simulateOwnerPortfolio,
  summarizeOwnerPortfolios,
} from './queries';
import { getPublicSharedPortfolioPageData } from './shared-page-service';

/**
 * Application interface for portfolio intentions. Route controllers depend on
 * this one module; authorization and HTTP decoding stay outside, while owner
 * checks, offer lookup, transactions, and export encoding remain behind it.
 */
export const portfolioApplication = {
  createPortfolio: createOwnerPortfolio,
  deletePortfolio: deleteOwnerPortfolio,
  listPortfolios: listOwnerPortfolios,
  createLot: createPortfolioLot,
  createLotWithTransaction: createPortfolioLotWithBuyTransaction,
  updateLot: updateOwnerLot,
  deleteLot: deleteOwnerLot,
  listLots: listPortfolioLots,
  importPortfolio: importOwnerPortfolio,
  setPortfolioVisibility: toggleOwnerPortfolioSharing,
  simulatePortfolio: simulateOwnerPortfolio,
  exportPortfolio: exportOwnerPortfolio,
  summarizePortfolios: summarizeOwnerPortfolios,
  loadSharedPortfolio: getPublicSharedPortfolioPageData,
};
