import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { DollarSign, Settings, Eye, RefreshCw } from "lucide-react";
import { 
  useCurrencies, 
  useTenantCurrencySettings, 
  useCreateTenantCurrencySettings, 
  useUpdateTenantCurrencySettings,
  formatCurrency,
  Currency
} from "@/hooks/useCurrencyManagement";

const CurrencyConfigPage = () => {
  const [previewAmount] = useState(12345.67);
  
  const { data: currencies = [], isLoading: currenciesLoading } = useCurrencies();
  const { data: currencySettings, isLoading: settingsLoading, refetch } = useTenantCurrencySettings();
  const createSettingsMutation = useCreateTenantCurrencySettings();
  const updateSettingsMutation = useUpdateTenantCurrencySettings();

  const [formData, setFormData] = useState({
    default_currency_id: currencySettings?.default_currency_id || "",
    display_format: currencySettings?.display_format || "symbol_before" as const,
    thousand_separator: currencySettings?.thousand_separator || ",",
    decimal_separator: currencySettings?.decimal_separator || ".",
    show_decimals: currencySettings?.show_decimals ?? true,
  });

  // Update form data when settings load
  React.useEffect(() => {
    if (currencySettings) {
      setFormData({
        default_currency_id: currencySettings.default_currency_id,
        display_format: currencySettings.display_format,
        thousand_separator: currencySettings.thousand_separator,
        decimal_separator: currencySettings.decimal_separator,
        show_decimals: currencySettings.show_decimals,
      });
    }
  }, [currencySettings]);

  const handleSave = async () => {
    try {
      if (currencySettings) {
        await updateSettingsMutation.mutateAsync({
          id: currencySettings.id,
          ...formData,
        });
      } else {
        await createSettingsMutation.mutateAsync(formData);
      }
      refetch();
    } catch (error) {
      console.error('Error saving currency settings:', error);
    }
  };

  const displayFormatOptions = [
    { value: 'symbol_before', label: 'Symbol Before (e.g., $1,234.56)' },
    { value: 'symbol_after', label: 'Symbol After (e.g., 1,234.56$)' },
    { value: 'code_before', label: 'Code Before (e.g., USD 1,234.56)' },
    { value: 'code_after', label: 'Code After (e.g., 1,234.56 USD)' },
  ];

  const separatorOptions = [
    { value: ',', label: 'Comma (,)' },
    { value: '.', label: 'Period (.)' },
    { value: ' ', label: 'Space ( )' },
    { value: "'", label: "Apostrophe (')" },
  ];

  const getPreviewCurrency = (): Currency | undefined => {
    return currencies.find(c => c.id === formData.default_currency_id);
  };

  const getFormattedPreview = () => {
    const currency = getPreviewCurrency();
    if (!currency) return previewAmount.toString();
    
    return formatCurrency(previewAmount, {
      ...currencySettings,
      ...formData,
      default_currency: currency,
    } as any);
  };

  if (currenciesLoading || settingsLoading) {
    return (
      <div className="flex items-center justify-center py-8">
        <RefreshCw className="h-6 w-6 animate-spin" />
        <span className="ml-2">Loading currency settings...</span>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Currency Configuration</h1>
          <p className="text-muted-foreground">Configure your organization's default currency and formatting</p>
        </div>
        <Button onClick={handleSave} disabled={createSettingsMutation.isPending || updateSettingsMutation.isPending} className="gap-2">
          <Settings className="h-4 w-4" />
          {createSettingsMutation.isPending || updateSettingsMutation.isPending ? "Saving..." : "Save Settings"}
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Currency Settings */}
        <div className="lg:col-span-2 space-y-6">
          {/* Default Currency */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                Default Currency
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="default_currency">Select Default Currency</Label>
                <Select 
                  value={formData.default_currency_id} 
                  onValueChange={(value) => setFormData(prev => ({ ...prev, default_currency_id: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {currencies.map((currency) => (
                      <SelectItem key={currency.id} value={currency.id}>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{currency.code}</Badge>
                          <span>{currency.symbol}</span>
                          <span>{currency.name}</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {currencySettings?.default_currency && (
                <div className="p-4 bg-muted rounded-lg">
                  <h4 className="font-medium mb-2">Current Default Currency</h4>
                  <div className="flex items-center gap-4">
                    <Badge variant="default">{currencySettings.default_currency.code}</Badge>
                    <span className="text-2xl">{currencySettings.default_currency.symbol}</span>
                    <span>{currencySettings.default_currency.name}</span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Display Format */}
          <Card>
            <CardHeader>
              <CardTitle>Display Format</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="display_format">Currency Display Format</Label>
                <Select 
                  value={formData.display_format} 
                  onValueChange={(value: any) => setFormData(prev => ({ ...prev, display_format: value }))}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {displayFormatOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="thousand_separator">Thousand Separator</Label>
                  <Select 
                    value={formData.thousand_separator} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, thousand_separator: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {separatorOptions.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="decimal_separator">Decimal Separator</Label>
                  <Select 
                    value={formData.decimal_separator} 
                    onValueChange={(value) => setFormData(prev => ({ ...prev, decimal_separator: value }))}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value=".">Period (.)</SelectItem>
                      <SelectItem value=",">Comma (,)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch
                  id="show_decimals"
                  checked={formData.show_decimals}
                  onCheckedChange={(checked) => setFormData(prev => ({ ...prev, show_decimals: checked }))}
                />
                <Label htmlFor="show_decimals">Show decimal places</Label>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Preview */}
        <div className="space-y-6">
          <Card>
            <div className="h-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Eye className="h-5 w-5" />
                  Live Preview
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="text-center p-6 bg-gradient-to-br from-primary/10 to-primary/5 rounded-lg border-2 border-dashed border-primary/20">
                    <p className="text-sm text-muted-foreground mb-2">Sample Amount:</p>
                    <p className="text-3xl font-bold text-primary">
                      {getFormattedPreview()}
                    </p>
                  </div>

                  <Separator />

                  <div className="space-y-2">
                    <h4 className="font-medium">Other Examples:</h4>
                    <div className="space-y-1 text-sm">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Small:</span>
                        <span className="font-mono">
                          {formatCurrency(9.99, {
                            ...currencySettings,
                            ...formData,
                            default_currency: getPreviewCurrency(),
                          } as any)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Medium:</span>
                        <span className="font-mono">
                          {formatCurrency(1234.56, {
                            ...currencySettings,
                            ...formData,
                            default_currency: getPreviewCurrency(),
                          } as any)}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Large:</span>
                        <span className="font-mono">
                          {formatCurrency(1234567.89, {
                            ...currencySettings,
                            ...formData,
                            default_currency: getPreviewCurrency(),
                          } as any)}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </div>
          </Card>

          {/* Available Currencies */}
          <Card>
            <CardHeader>
              <CardTitle>Available Currencies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 max-h-64 overflow-y-auto">
                {currencies.map((currency) => (
                  <div key={currency.id} className="flex items-center justify-between p-2 rounded border">
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs">{currency.code}</Badge>
                      <span className="text-lg">{currency.symbol}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{currency.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default CurrencyConfigPage;