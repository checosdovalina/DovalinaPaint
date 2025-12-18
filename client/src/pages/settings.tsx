import { Helmet } from "react-helmet";
import PageHeader from "@/components/page-header";
import { Layout } from "@/components/layout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select";
import { 
  Calendar,
  Settings as SettingsIcon,
  Globe,
  Bell,
  Key,
  RefreshCw as Sync,
  CheckCircle,
  AlertCircle,
  Clock,
  Users,
  Palette,
  Shield,
  Trash2
} from "lucide-react";
import { useState } from "react";
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage, FormDescription } from "@/components/ui/form";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

// Schema for Google Calendar settings
const googleCalendarSchema = z.object({
  clientId: z.string().min(1, "Client ID is required"),
  clientSecret: z.string().min(1, "Client Secret is required"),
  redirectUri: z.string().url("Must be a valid URL"),
  calendarId: z.string().optional(),
  syncEnabled: z.boolean().default(false),
  syncInterval: z.enum(["5", "15", "30", "60"]).default("15"),
  autoCreateEvents: z.boolean().default(true),
  eventPrefix: z.string().optional(),
  reminderMinutes: z.string().default("15"),
});

// Schema for general settings
const generalSettingsSchema = z.object({
  companyName: z.string().min(1, "Company name is required"),
  language: z.enum(["en", "es"]).default("en"),
  timezone: z.string(),
  currency: z.string().default("USD"),
  dateFormat: z.enum(["MM/DD/YYYY", "DD/MM/YYYY", "YYYY-MM-DD"]).default("MM/DD/YYYY"),
  defaultQuoteValidDays: z.string().default("30"),
  emailNotifications: z.boolean().default(true),
  smsNotifications: z.boolean().default(false),
});

type GoogleCalendarSettings = z.infer<typeof googleCalendarSchema>;
type GeneralSettings = z.infer<typeof generalSettingsSchema>;

export default function SettingsPage() {
  const { toast } = useToast();
  const { user } = useAuth();
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connected' | 'error'>('disconnected');
  const [showResetConfirmation, setShowResetConfirmation] = useState(false);

  // Google Calendar form
  const googleCalendarForm = useForm<GoogleCalendarSettings>({
    resolver: zodResolver(googleCalendarSchema),
    defaultValues: {
      clientId: "",
      clientSecret: "",
      redirectUri: `${window.location.origin}/auth/google/callback`,
      calendarId: "",
      syncEnabled: false,
      syncInterval: "15",
      autoCreateEvents: true,
      eventPrefix: "PinturaPro - ",
      reminderMinutes: "15",
    },
  });

  // General settings form
  const generalSettingsForm = useForm<GeneralSettings>({
    resolver: zodResolver(generalSettingsSchema),
    defaultValues: {
      companyName: "Dovalina Pro Painters",
      language: "en",
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      currency: "USD",
      dateFormat: "MM/DD/YYYY",
      defaultQuoteValidDays: "30",
      emailNotifications: true,
      smsNotifications: false,
    },
  });

  // Fetch current settings
  const { data: currentSettings, isLoading } = useQuery({
    queryKey: ["/api/settings"],
    queryFn: async () => {
      try {
        const response = await fetch("/api/settings");
        if (response.ok) {
          return await response.json();
        }
        return null;
      } catch (error) {
        return null;
      }
    },
  });

  // Google Calendar connection mutation
  const connectGoogleCalendarMutation = useMutation({
    mutationFn: async (settings: GoogleCalendarSettings) => {
      const response = await apiRequest("POST", "/api/settings/google-calendar/connect", settings);
      return await response.json();
    },
    onSuccess: () => {
      setConnectionStatus('connected');
      toast({
        title: "Google Calendar Connected",
        description: "Successfully connected to Google Calendar",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error: Error) => {
      setConnectionStatus('error');
      toast({
        title: "Connection Failed",
        description: error.message,
        variant: "destructive",
      });
    },
    onSettled: () => {
      setIsConnecting(false);
    },
  });

  // Test Google Calendar connection
  const testGoogleCalendarMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/settings/google-calendar/test");
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Connection Test Successful",
        description: "Google Calendar connection is working properly",
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Connection Test Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Sync now mutation
  const syncNowMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/settings/google-calendar/sync");
      return await response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Sync Completed",
        description: `Synchronized ${data.eventsCreated || 0} events`,
      });
    },
    onError: (error: Error) => {
      toast({
        title: "Sync Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Save general settings mutation
  const saveGeneralSettingsMutation = useMutation({
    mutationFn: async (settings: GeneralSettings) => {
      const response = await apiRequest("POST", "/api/settings/general", settings);
      return await response.json();
    },
    onSuccess: () => {
      toast({
        title: "Settings Saved",
        description: "General settings have been updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/settings"] });
    },
    onError: (error: Error) => {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  // Reset database mutation
  const resetDatabaseMutation = useMutation({
    mutationFn: async () => {
      const response = await apiRequest("POST", "/api/admin/reset-database", {});
      return await response.json();
    },
    onSuccess: (data) => {
      setShowResetConfirmation(false);
      toast({
        title: "Database Reset Successful",
        description: data.message,
      });
      // Optionally refresh data after reset
      queryClient.invalidateQueries();
    },
    onError: (error: Error) => {
      toast({
        title: "Reset Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const onGoogleCalendarSubmit = (data: GoogleCalendarSettings) => {
    setIsConnecting(true);
    connectGoogleCalendarMutation.mutate(data);
  };

  const onGeneralSettingsSubmit = (data: GeneralSettings) => {
    saveGeneralSettingsMutation.mutate(data);
  };

  const handleTestConnection = () => {
    testGoogleCalendarMutation.mutate();
  };

  const handleSyncNow = () => {
    syncNowMutation.mutate();
  };

  const getConnectionStatusBadge = () => {
    switch (connectionStatus) {
      case 'connected':
        return (
          <Badge variant="default" className="bg-green-500">
            <CheckCircle className="w-3 h-3 mr-1" />
            Connected
          </Badge>
        );
      case 'error':
        return (
          <Badge variant="destructive">
            <AlertCircle className="w-3 h-3 mr-1" />
            Error
          </Badge>
        );
      default:
        return (
          <Badge variant="secondary">
            <AlertCircle className="w-3 h-3 mr-1" />
            Disconnected
          </Badge>
        );
    }
  };

  return (
    <Layout title="Settings">
      <Helmet>
        <title>Settings - Dovalina Pro Painters</title>
      </Helmet>

      <PageHeader
        title="Settings"
        description="Configure application settings and integrations"
      />

      <div className="space-y-6">
        <Tabs defaultValue="general" className="w-full">
          <TabsList className={`grid w-full ${user?.role === "superadmin" ? "grid-cols-5" : "grid-cols-4"}`}>
            <TabsTrigger value="general" className="flex items-center gap-2">
              <SettingsIcon className="w-4 h-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="google-calendar" className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              Google Calendar
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-2">
              <Bell className="w-4 h-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="security" className="flex items-center gap-2">
              <Shield className="w-4 h-4" />
              Security
            </TabsTrigger>
            {user?.role === "superadmin" && (
              <TabsTrigger value="admin" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Administration
              </TabsTrigger>
            )}
          </TabsList>

          {/* General Settings Tab */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  General Settings
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Form {...generalSettingsForm}>
                  <form onSubmit={generalSettingsForm.handleSubmit(onGeneralSettingsSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={generalSettingsForm.control}
                        name="companyName"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Company Name</FormLabel>
                            <FormControl>
                              <Input placeholder="Company name" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={generalSettingsForm.control}
                        name="language"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Language</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select language" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="en">English</SelectItem>
                                <SelectItem value="es">Español</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={generalSettingsForm.control}
                        name="timezone"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Timezone</FormLabel>
                            <FormControl>
                              <Input placeholder="Timezone" {...field} />
                            </FormControl>
                            <FormDescription>
                              Current: {Intl.DateTimeFormat().resolvedOptions().timeZone}
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={generalSettingsForm.control}
                        name="currency"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Currency</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select currency" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="USD">USD - US Dollar</SelectItem>
                                <SelectItem value="EUR">EUR - Euro</SelectItem>
                                <SelectItem value="MXN">MXN - Mexican Peso</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={generalSettingsForm.control}
                        name="dateFormat"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Date Format</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select date format" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                                <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                                <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={generalSettingsForm.control}
                        name="defaultQuoteValidDays"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Default Quote Validity (Days)</FormLabel>
                            <FormControl>
                              <Input type="number" placeholder="30" {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={saveGeneralSettingsMutation.isPending}
                      className="w-full md:w-auto"
                    >
                      {saveGeneralSettingsMutation.isPending ? "Saving..." : "Save Settings"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Google Calendar Tab */}
          <TabsContent value="google-calendar" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Google Calendar Integration
                  {getConnectionStatusBadge()}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  Connect your Google Calendar to automatically sync project schedules and appointments.
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-400">
                  <h4 className="font-medium text-blue-900 mb-2">Setup Instructions:</h4>
                  <ol className="text-sm text-blue-800 space-y-1 list-decimal list-inside">
                    <li>Go to the <a href="https://console.cloud.google.com/" target="_blank" className="underline">Google Cloud Console</a></li>
                    <li>Create a new project or select an existing one</li>
                    <li>Enable the Google Calendar API</li>
                    <li>Create OAuth 2.0 credentials (Client ID and Secret)</li>
                    <li>Add the redirect URI: <code className="bg-blue-100 px-1 rounded">{window.location.origin}/auth/google/callback</code></li>
                  </ol>
                </div>

                <Form {...googleCalendarForm}>
                  <form onSubmit={googleCalendarForm.handleSubmit(onGoogleCalendarSubmit)} className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={googleCalendarForm.control}
                        name="clientId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Google Client ID</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Google OAuth Client ID" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={googleCalendarForm.control}
                        name="clientSecret"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Google Client Secret</FormLabel>
                            <FormControl>
                              <Input 
                                type="password" 
                                placeholder="Google OAuth Client Secret" 
                                {...field} 
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={googleCalendarForm.control}
                        name="redirectUri"
                        render={({ field }) => (
                          <FormItem className="md:col-span-2">
                            <FormLabel>Redirect URI</FormLabel>
                            <FormControl>
                              <Input {...field} readOnly />
                            </FormControl>
                            <FormDescription>
                              Add this URI to your Google OAuth configuration
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={googleCalendarForm.control}
                        name="calendarId"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Calendar ID (Optional)</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="primary or calendar@gmail.com" 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Leave empty to use primary calendar
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={googleCalendarForm.control}
                        name="eventPrefix"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Event Title Prefix</FormLabel>
                            <FormControl>
                              <Input 
                                placeholder="PinturaPro - " 
                                {...field} 
                              />
                            </FormControl>
                            <FormDescription>
                              Prefix for created calendar events
                            </FormDescription>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <Separator />

                    <div className="space-y-4">
                      <h4 className="font-medium">Sync Settings</h4>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={googleCalendarForm.control}
                          name="syncInterval"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Sync Interval (minutes)</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select interval" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="5">Every 5 minutes</SelectItem>
                                  <SelectItem value="15">Every 15 minutes</SelectItem>
                                  <SelectItem value="30">Every 30 minutes</SelectItem>
                                  <SelectItem value="60">Every hour</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={googleCalendarForm.control}
                          name="reminderMinutes"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Default Reminder (minutes)</FormLabel>
                              <FormControl>
                                <Input 
                                  type="number" 
                                  placeholder="15" 
                                  {...field} 
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <div className="space-y-3">
                        <FormField
                          control={googleCalendarForm.control}
                          name="syncEnabled"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Enable Automatic Sync</FormLabel>
                                <FormDescription>
                                  Automatically sync events at the specified interval
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={googleCalendarForm.control}
                          name="autoCreateEvents"
                          render={({ field }) => (
                            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                              <div className="space-y-0.5">
                                <FormLabel>Auto-create Events</FormLabel>
                                <FormDescription>
                                  Automatically create calendar events for new projects and service orders
                                </FormDescription>
                              </div>
                              <FormControl>
                                <Switch
                                  checked={field.value}
                                  onCheckedChange={field.onChange}
                                />
                              </FormControl>
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Button 
                        type="submit" 
                        disabled={isConnecting}
                        className="flex items-center gap-2"
                      >
                        <Key className="w-4 h-4" />
                        {isConnecting ? "Connecting..." : "Connect to Google Calendar"}
                      </Button>

                      {connectionStatus === 'connected' && (
                        <>
                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={handleTestConnection}
                            disabled={testGoogleCalendarMutation.isPending}
                            className="flex items-center gap-2"
                          >
                            <CheckCircle className="w-4 h-4" />
                            Test Connection
                          </Button>

                          <Button 
                            type="button" 
                            variant="outline"
                            onClick={handleSyncNow}
                            disabled={syncNowMutation.isPending}
                            className="flex items-center gap-2"
                          >
                            <Sync className="w-4 h-4" />
                            {syncNowMutation.isPending ? "Syncing..." : "Sync Now"}
                          </Button>
                        </>
                      )}
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bell className="w-5 h-5" />
                  Notification Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Form {...generalSettingsForm}>
                  <form onSubmit={generalSettingsForm.handleSubmit(onGeneralSettingsSubmit)} className="space-y-4">
                    <div className="space-y-3">
                      <FormField
                        control={generalSettingsForm.control}
                        name="emailNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>Email Notifications</FormLabel>
                              <FormDescription>
                                Receive notifications via email for important updates
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={generalSettingsForm.control}
                        name="smsNotifications"
                        render={({ field }) => (
                          <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>SMS Notifications</FormLabel>
                              <FormDescription>
                                Receive text message notifications for urgent updates
                              </FormDescription>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />
                    </div>

                    <Button 
                      type="submit" 
                      disabled={saveGeneralSettingsMutation.isPending}
                      className="w-full md:w-auto"
                    >
                      {saveGeneralSettingsMutation.isPending ? "Saving..." : "Save Notification Settings"}
                    </Button>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Tab */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Security Settings
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="current-password">Current Password</Label>
                      <Input id="current-password" type="password" placeholder="Enter current password" />
                    </div>
                    <div>
                      <Label htmlFor="new-password">New Password</Label>
                      <Input id="new-password" type="password" placeholder="Enter new password" />
                    </div>
                  </div>
                  <Button variant="outline" className="w-full md:w-auto">
                    Update Password
                  </Button>
                </div>

                <Separator />

                <div className="space-y-3">
                  <h4 className="font-medium">Two-Factor Authentication</h4>
                  <p className="text-sm text-muted-foreground">
                    Add an extra layer of security to your account
                  </p>
                  <Button variant="outline" className="w-full md:w-auto">
                    Enable 2FA
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Administration Tab (only for superadmin) */}
          {user?.role === "superadmin" && (
            <TabsContent value="admin" className="space-y-6">
              <Card className="border-red-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-red-600">
                    <Trash2 className="w-5 h-5" />
                    Database Management
                  </CardTitle>
                  <p className="text-sm text-muted-foreground mt-2">
                    Dangerous operations that affect the entire system. Use with caution.
                  </p>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                    <h4 className="font-medium text-red-900 mb-2">Reset Database</h4>
                    <p className="text-sm text-red-800 mb-4">
                      This will delete all data (clients, projects, quotes, invoices, etc.) from the database. 
                      User accounts will be preserved. This action cannot be undone.
                    </p>
                    <Button 
                      variant="destructive"
                      onClick={() => setShowResetConfirmation(true)}
                      disabled={resetDatabaseMutation.isPending}
                      className="w-full md:w-auto"
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      {resetDatabaseMutation.isPending ? "Resetting..." : "Reset Database"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>

        {/* Reset Confirmation Dialog */}
        <AlertDialog open={showResetConfirmation} onOpenChange={setShowResetConfirmation}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle className="text-red-600">Confirm Database Reset</AlertDialogTitle>
              <AlertDialogDescription className="space-y-2 mt-4">
                <p>Are you absolutely sure you want to reset the database?</p>
                <p className="font-medium text-red-600">
                  This will permanently delete:
                </p>
                <ul className="text-sm list-disc list-inside text-red-600 space-y-1">
                  <li>All clients and prospects</li>
                  <li>All projects and quotes</li>
                  <li>All invoices and payments</li>
                  <li>All service orders and activities</li>
                  <li>All other business data</li>
                </ul>
                <p className="font-medium text-green-600 mt-2">User accounts will be preserved.</p>
              </AlertDialogDescription>
            </AlertDialogHeader>
            <div className="flex gap-4 justify-end mt-4">
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction 
                onClick={() => resetDatabaseMutation.mutate()}
                className="bg-red-600 hover:bg-red-700"
              >
                Reset Database
              </AlertDialogAction>
            </div>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </Layout>
  );
}