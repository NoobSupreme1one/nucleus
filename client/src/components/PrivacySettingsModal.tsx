import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import type { UserPrivacySettings } from "@shared/types";

interface PrivacySettingsModalProps {
  trigger?: React.ReactNode;
  isOpen?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function PrivacySettingsModal({ trigger, isOpen, onOpenChange }: PrivacySettingsModalProps) {
  const [settings, setSettings] = useState<UserPrivacySettings>({
    profilePublic: true,
    ideasPublic: true,
    allowFounderMatching: true,
    allowDirectContact: true,
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const { toast } = useToast();

  // Load current privacy settings
  useEffect(() => {
    if (isOpen) {
      loadPrivacySettings();
    }
  }, [isOpen]);

  const loadPrivacySettings = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/users/privacy-settings', {
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success && data.privacySettings) {
          setSettings(data.privacySettings);
        }
      } else {
        throw new Error('Failed to load privacy settings');
      }
    } catch (error) {
      console.error('Error loading privacy settings:', error);
      toast({
        title: "Error",
        description: "Failed to load privacy settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const savePrivacySettings = async () => {
    setSaving(true);
    try {
      const response = await fetch('/api/users/privacy-settings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify(settings),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          toast({
            title: "Success",
            description: "Privacy settings updated successfully.",
          });
          onOpenChange?.(false);
        } else {
          throw new Error(data.error?.message || 'Failed to update privacy settings');
        }
      } else {
        throw new Error('Failed to update privacy settings');
      }
    } catch (error) {
      console.error('Error saving privacy settings:', error);
      toast({
        title: "Error",
        description: "Failed to update privacy settings. Please try again.",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  const updateSetting = (key: keyof UserPrivacySettings, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      [key]: value,
    }));
  };

  const getVisibilityBadge = (isPublic: boolean) => {
    return isPublic ? (
      <Badge className="bg-green-100 text-green-800">
        <i className="fas fa-eye mr-1"></i>
        Public
      </Badge>
    ) : (
      <Badge className="bg-gray-100 text-gray-800">
        <i className="fas fa-eye-slash mr-1"></i>
        Private
      </Badge>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center text-xl">
            <i className="fas fa-shield-alt text-blue-600 mr-2"></i>
            Privacy Settings
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-gray-600">Loading privacy settings...</span>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Profile Visibility */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center">
                    <i className="fas fa-user text-blue-600 mr-2"></i>
                    Profile Visibility
                  </span>
                  {getVisibilityBadge(settings.profilePublic)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Make my profile public</h4>
                    <p className="text-sm text-gray-600">
                      Allow other users to see your profile information, including name, role, and bio.
                    </p>
                  </div>
                  <Switch
                    checked={settings.profilePublic}
                    onCheckedChange={(checked) => updateSetting('profilePublic', checked)}
                  />
                </div>
                
                {!settings.profilePublic && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                    <div className="flex items-start">
                      <i className="fas fa-exclamation-triangle text-yellow-600 mr-2 mt-0.5"></i>
                      <div className="text-sm text-yellow-800">
                        <strong>Note:</strong> Making your profile private will prevent other founders from finding and connecting with you.
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Ideas Visibility */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center">
                    <i className="fas fa-lightbulb text-yellow-600 mr-2"></i>
                    Ideas Visibility
                  </span>
                  {getVisibilityBadge(settings.ideasPublic)}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Make my ideas public</h4>
                    <p className="text-sm text-gray-600">
                      Allow other users to see your validated ideas and business concepts for potential collaboration.
                    </p>
                  </div>
                  <Switch
                    checked={settings.ideasPublic}
                    onCheckedChange={(checked) => updateSetting('ideasPublic', checked)}
                  />
                </div>
                
                {!settings.ideasPublic && (
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                    <div className="flex items-start">
                      <i className="fas fa-info-circle text-blue-600 mr-2 mt-0.5"></i>
                      <div className="text-sm text-blue-800">
                        Private ideas will not be visible to other users and won't be used for founder matching.
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Founder Matching */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center">
                    <i className="fas fa-handshake text-green-600 mr-2"></i>
                    Founder Matching
                  </span>
                  <Badge className={settings.allowFounderMatching ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {settings.allowFounderMatching ? "Enabled" : "Disabled"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Allow founder matching</h4>
                    <p className="text-sm text-gray-600">
                      Include me in founder matching algorithms and show me as a potential co-founder to others.
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowFounderMatching}
                    onCheckedChange={(checked) => updateSetting('allowFounderMatching', checked)}
                  />
                </div>
                
                {settings.allowFounderMatching && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <div className="flex items-start">
                      <i className="fas fa-check-circle text-green-600 mr-2 mt-0.5"></i>
                      <div className="text-sm text-green-800">
                        You'll appear in founder matching results for users with complementary skills and similar interests.
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Direct Contact */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center justify-between">
                  <span className="flex items-center">
                    <i className="fas fa-envelope text-purple-600 mr-2"></i>
                    Direct Contact
                  </span>
                  <Badge className={settings.allowDirectContact ? "bg-green-100 text-green-800" : "bg-gray-100 text-gray-800"}>
                    {settings.allowDirectContact ? "Allowed" : "Restricted"}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">Allow direct contact</h4>
                    <p className="text-sm text-gray-600">
                      Allow other users to contact you directly through the platform for collaboration opportunities.
                    </p>
                  </div>
                  <Switch
                    checked={settings.allowDirectContact}
                    onCheckedChange={(checked) => updateSetting('allowDirectContact', checked)}
                  />
                </div>
                
                {!settings.allowDirectContact && (
                  <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                    <div className="flex items-start">
                      <i className="fas fa-shield-alt text-gray-600 mr-2 mt-0.5"></i>
                      <div className="text-sm text-gray-700">
                        Other users won't be able to send you direct messages, but you can still initiate contact with them.
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Separator />

            {/* Action Buttons */}
            <div className="flex justify-end space-x-3">
              <Button
                variant="outline"
                onClick={() => onOpenChange?.(false)}
                disabled={saving}
              >
                Cancel
              </Button>
              <Button
                onClick={savePrivacySettings}
                disabled={saving}
                className="min-w-[100px]"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Saving...
                  </>
                ) : (
                  <>
                    <i className="fas fa-save mr-2"></i>
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
