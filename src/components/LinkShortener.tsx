import React, { useState } from 'react';
import { Link2, Copy, Check, QrCode, ExternalLink, Calendar, Type, FileText } from 'lucide-react';
import { Button } from './ui/Button';
import { Input } from './ui/Input';
import { Card, CardHeader, CardTitle, CardContent } from './ui/Card';
import { useApi } from '../hooks/useApi';
import { isValidUrl, copyToClipboard, getDomainFromUrl } from '../lib/utils';

interface LinkShortenerProps {
  onLinkCreated?: () => void;
}

export function LinkShortener({ onLinkCreated }: LinkShortenerProps) {
  const [url, setUrl] = useState('');
  const [customAlias, setCustomAlias] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [shortUrl, setShortUrl] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [copied, setCopied] = useState(false);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const { createLink, getQRCode, loading, error } = useApi();

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!url.trim()) {
      newErrors.url = 'URL is required';
    } else if (!isValidUrl(url)) {
      newErrors.url = 'Please enter a valid URL';
    }

    if (customAlias && customAlias.length < 3) {
      newErrors.customAlias = 'Custom alias must be at least 3 characters';
    }

    if (expiresAt && new Date(expiresAt) <= new Date()) {
      newErrors.expiresAt = 'Expiration date must be in the future';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    try {
      const link = await createLink({
        originalUrl: url,
        customAlias: customAlias || undefined,
        title: title || undefined,
        description: description || undefined,
        expiresAt: expiresAt || undefined,
      });

      const shortUrl = `${window.location.origin}/s/${link.customAlias || link.shortCode}`;
      setShortUrl(shortUrl);

      // Generate QR code
      const qrResponse = await getQRCode(link.id);
      setQrCode(qrResponse.qrCode);

      // Reset form
      setUrl('');
      setCustomAlias('');
      setTitle('');
      setDescription('');
      setExpiresAt('');
      setShowAdvanced(false);
      setErrors({});

      onLinkCreated?.();
    } catch (err) {
      console.error('Failed to create link:', err);
    }
  };

  const handleCopy = async () => {
    try {
      await copyToClipboard(shortUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const handleReset = () => {
    setShortUrl('');
    setQrCode('');
    setCopied(false);
  };

  if (shortUrl) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader className="text-center">
          <CardTitle className="flex items-center justify-center gap-2 text-green-600 dark:text-green-400">
            <Check className="w-6 h-6" />
            Link Created Successfully!
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <p className="text-sm text-green-700 dark:text-green-300 mb-2">Your shortened URL:</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 p-2 bg-white dark:bg-gray-800 rounded border text-sm font-mono">
                {shortUrl}
              </code>
              <Button
                size="sm"
                variant="outline"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => window.open(shortUrl, '_blank')}
                className="shrink-0"
              >
                <ExternalLink className="w-4 h-4" />
              </Button>
            </div>
          </div>

          {qrCode && (
            <div className="text-center">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">QR Code:</p>
              <div className="inline-block p-4 bg-white rounded-lg shadow-sm border">
                <img src={qrCode} alt="QR Code" className="w-32 h-32" />
              </div>
            </div>
          )}

          <div className="flex gap-3">
            <Button onClick={handleReset} variant="primary" className="flex-1">
              Create Another Link
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="max-w-2xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Link2 className="w-6 h-6 text-purple-600" />
          Shorten Your Link
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          <Input
            label="Long URL"
            placeholder="https://example.com/very/long/url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            error={errors.url}
            required
          />

          <div className="flex items-center justify-between">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="text-purple-600 hover:text-purple-700"
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced Options
            </Button>
          </div>

          {showAdvanced && (
            <div className="space-y-4 p-4 bg-gray-50 dark:bg-gray-900/30 rounded-lg border border-gray-200 dark:border-gray-700">
              <Input
                label="Custom Alias (Optional)"
                placeholder="my-custom-link"
                value={customAlias}
                onChange={(e) => setCustomAlias(e.target.value)}
                error={errors.customAlias}
                helper="Create a custom short URL. Leave empty for auto-generated."
              />

              <Input
                label="Title (Optional)"
                placeholder="My Awesome Link"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                helper="A descriptive title for your link"
              />

              <Input
                label="Description (Optional)"
                placeholder="A brief description of the link"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                helper="Optional description for better organization"
              />

              <Input
                type="datetime-local"
                label="Expires At (Optional)"
                value={expiresAt}
                onChange={(e) => setExpiresAt(e.target.value)}
                error={errors.expiresAt}
                helper="Set an expiration date for the link"
              />
            </div>
          )}

          {error && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-lg border border-red-200 dark:border-red-800">
              <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
            </div>
          )}

          <Button
            type="submit"
            loading={loading}
            className="w-full"
            size="lg"
          >
            <Link2 className="w-5 h-5 mr-2" />
            Shorten URL
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}