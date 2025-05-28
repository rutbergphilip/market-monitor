import { Request, Response } from 'express';
import { getAllMarketplaces, getMarketplaceAdapter } from '@/marketplaces';
import type { BaseMarketplaceAdapter } from '@/marketplaces';

/**
 * Get list of all available marketplaces
 */
export async function getMarketplaces(req: Request, res: Response) {
  try {
    const marketplaces = getAllMarketplaces().map(
      (adapter: BaseMarketplaceAdapter) => ({
        type: adapter.type,
        name: adapter.name,
        capabilities: adapter.capabilities,
      }),
    );

    res.json({
      marketplaces,
      totalCount: marketplaces.length,
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get marketplaces',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}

/**
 * Get specific marketplace information
 */
export async function getMarketplaceInfo(req: Request, res: Response) {
  try {
    const { type } = req.params;
    const adapter = getMarketplaceAdapter(type as any);

    if (!adapter) {
      res.status(404).json({
        error: 'Marketplace not found',
        type,
      });
      return;
    }

    res.json({
      type: adapter.type,
      name: adapter.name,
      capabilities: adapter.capabilities,
      defaultSettings: adapter.getDefaultSettings(),
    });
  } catch (error) {
    res.status(500).json({
      error: 'Failed to get marketplace info',
      message: error instanceof Error ? error.message : 'Unknown error',
    });
  }
}
