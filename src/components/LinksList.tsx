import React, { useState } from 'react';
import { ExternalLink, Copy, QrCode, Calendar, TrendingUp, Eye, Check, Trash2 } from 'lucide-react';
import { Card, CardContent } from './ui/Card';
import { Button } from './ui/Button';
import { useLinks, useApi } from '../hooks/useApi';
import { formatDate, getDomainFromUrl, copyToClipboard } from '../lib/utils';

export function LinksList() {
  const { links, loading, error, refreshLinks } = useLinks();
  const { getQRCode } = useApi();
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrCodes, setQrCodes] = useState<Record<string, string>>({});

  const handleCopy = async (shortUrl: string, linkId: string) => {
    try {
      await copyToClipboard(shortUrl);
      setCopiedId(linkId);
      setTimeout(() => setCopiedId(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleShowQR = async (linkId: string) => {
    if (qrCodes[linkId]) {
      setQrCodes(prev => ({ ...prev, [linkId]: '' }));
      return;
    }

    try {
      const response = await getQRCode(linkId);
      setQrCodes(prev => ({ ...prev, [linkId]: response.qrCode }));
    } catch (err) {
      console.error('Failed to generate QR code:', err);
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[...Array(3)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent>
              <div className="h-4 bg-gray-300 dark:bg-gray-600 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-gray-300 dark:bg-gray-600 rounded w-1/2"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-8">
            <p className="text-red-600 dark:text-red-400">Error loading links: {error}</p>
            <Button onClick={refreshLinks} variant="outline" className="mt-4">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!links.length) {
    return (
      <Card>
        <CardContent>
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
              <ExternalLink className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-800 dark:text-gray-200 mb-2">
              No links yet
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              Create your first shortened link to get started!
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-gray-200">
          Your Links ({links.length})
        </h2>
        <Button onClick={refreshLinks} variant="outline" size="sm">
          Refresh
        </Button>
      </div>

      {links.map((link) => {
        const shortUrl = `${window.location.origin}/s/${link.customAlias || link.shortCode}`;
        const domain = getDomainFromUrl(link.originalUrl);
        const isExpired = link.expiresAt && new Date() > new Date(link.expiresAt);

        return (
          <Card key={link.id} className={`transition-all duration-200 ${isExpired ? 'opacity-60' : ''}`}>
            <CardContent>
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-semibold text-gray-800 dark:text-gray-200 truncate">
                      {link.title || domain}
                    </h3>
                    {isExpired && (
                      <span className="px-2 py-1 text-xs bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded-full">
                        Expired
                      </span>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <code className="text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-2 py-1 rounded font-mono">
                        {shortUrl}
                      </code>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => handleCopy(shortUrl, link.id)}
                      >
                        {copiedId === link.id ? (
                          <Check className="w-4 h-4 text-green-600" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                      </Button>
                    </div>
                    
                    <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                      {link.originalUrl}
                    </p>

                    {link.description && (
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {link.description}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-4 mt-3 text-sm text-gray-500 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <TrendingUp className="w-4 h-4" />
                      <span>{link.totalClicks} clicks</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(new Date(link.createdAt))}</span>
                    </div>
                    {link.expiresAt && (
                      <div className="flex items-center gap-1">
                        <span>Expires: {formatDate(new Date(link.expiresAt))}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => window.open(link.originalUrl, '_blank')}
                  >
                    <ExternalLink className="w-4 h-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleShowQR(link.id)}
                  >
                    <QrCode className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {qrCodes[link.id] && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-center">
                    <div className="p-4 bg-white rounded-lg border shadow-sm">
                      <img src={qrCodes[link.id]} alt="QR Code" className="w-24 h-24" />
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}