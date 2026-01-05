/**
 * Account Settings Page
 * 
 * Comprehensive settings with Profile, Security, and Notifications tabs.
 */

import { motion } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { User, Shield, Bell, Lock, ArrowLeft, CheckCircle2, Camera, Trash2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import Header from '@/layout/Header';
import Footer from '@/components/Footer';
import HBIcon from '@/components/HBIcon';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { supabase } from '@/integrations/supabase/client';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { useToast } from '@/hooks/use-toast';

// Profile form schema
const profileSchema = z.object({
  fullName: z.string().min(2, 'Name must be at least 2 characters').max(100),
  avatarUrl: z.string().url().optional().or(z.literal('')),
});

// Notification preferences schema
const notificationsSchema = z.object({
  emailNotifications: z.boolean(),
  orderUpdates: z.boolean(),
  marketing: z.boolean(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;
type NotificationFormValues = z.infer<typeof notificationsSchema>;

interface UserProfile {
  full_name: string | null;
  avatar_url: string | null;
  preferences: {
    emailNotifications?: boolean;
    orderUpdates?: boolean;
    marketing?: boolean;
  } | null;
}

const AccountSettings = () => {
  const navigate = useNavigate();
  const { t } = useTranslation('auth');
  const { toast } = useToast();
  
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isSavingNotifications, setIsSavingNotifications] = useState(false);
  
  // Profile form
  const profileForm = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: '',
      avatarUrl: '',
    },
  });
  
  // Notifications form
  const notificationsForm = useForm<NotificationFormValues>({
    resolver: zodResolver(notificationsSchema),
    defaultValues: {
      emailNotifications: true,
      orderUpdates: true,
      marketing: false,
    },
  });

  // Fetch user and profile data
  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        setUser(user);

        if (user) {
          const { data } = await supabase
            .from('profiles')
            .select('full_name, avatar_url, preferences')
            .eq('id', user.id)
            .maybeSingle();
          
          if (data) {
            setProfile(data as UserProfile);
            
            // Set form values
            profileForm.reset({
              fullName: data.full_name || '',
              avatarUrl: data.avatar_url || '',
            });
            
            const prefs = data.preferences as UserProfile['preferences'];
            notificationsForm.reset({
              emailNotifications: prefs?.emailNotifications ?? true,
              orderUpdates: prefs?.orderUpdates ?? true,
              marketing: prefs?.marketing ?? false,
            });
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchUserData();
  }, []);

  // Save profile
  const onSaveProfile = async (values: ProfileFormValues) => {
    if (!user) return;
    
    setIsSavingProfile(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: values.fullName,
          avatar_url: values.avatarUrl || null,
        })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: t('accountSettings.profile.saved'),
        description: t('accountSettings.profile.savedDescription', { defaultValue: 'Your profile has been updated.' }),
      });
      
      setProfile(prev => prev ? { ...prev, full_name: values.fullName, avatar_url: values.avatarUrl || null } : null);
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Error',
        description: 'Failed to save profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Save notification preferences
  const onSaveNotifications = async (values: NotificationFormValues) => {
    if (!user) return;
    
    setIsSavingNotifications(true);
    try {
      const currentPrefs = profile?.preferences || {};
      const newPrefs = {
        ...currentPrefs,
        ...values,
      };

      const { error } = await supabase
        .from('profiles')
        .update({ preferences: newPrefs })
        .eq('id', user.id);

      if (error) throw error;

      toast({
        title: t('accountSettings.notifications.saved'),
        description: t('accountSettings.notifications.savedDescription', { defaultValue: 'Your preferences have been updated.' }),
      });
      
      setProfile(prev => prev ? { ...prev, preferences: newPrefs } : null);
    } catch (error) {
      console.error('Error saving notifications:', error);
      toast({
        title: 'Error',
        description: 'Failed to save preferences. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSavingNotifications(false);
    }
  };

  // Get initials for avatar fallback
  const getInitials = (name: string | null) => {
    if (!name) return 'U';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  // Not logged in state
  if (!isLoading && !user) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="pt-32 pb-20">
          <div className="container mx-auto px-4 text-center">
            <Card className="max-w-md mx-auto bg-card/50 backdrop-blur-sm border-border/50">
              <CardContent className="pt-12 pb-8">
                <HBIcon size="xl" className="mx-auto mb-6 opacity-50" />
                <h2 className="text-2xl font-bold text-foreground mb-4">
                  {t('signInRequired', { defaultValue: 'Sign In Required' })}
                </h2>
                <p className="text-muted-foreground mb-6">
                  Please sign in to access your account settings.
                </p>
                <Button onClick={() => navigate('/auth')}>Sign In</Button>
              </CardContent>
            </Card>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <main className="pt-32 pb-24 lg:pb-20">
        <div className="container mx-auto px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="max-w-3xl mx-auto"
          >
            {/* Header */}
            <div className="mb-8">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate('/dashboard')}
                className="mb-4 -ml-2"
              >
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Dashboard
              </Button>
              <h1 className="text-3xl font-bold text-foreground mb-2">
                {t('accountSettings.title', { defaultValue: 'Account Settings' })}
              </h1>
              <p className="text-muted-foreground">
                {t('accountSettings.description', { defaultValue: 'Manage your profile and preferences' })}
              </p>
            </div>

            {/* Settings Tabs */}
            <Tabs defaultValue="profile" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3 bg-muted/50">
                <TabsTrigger value="profile" className="flex items-center gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('accountSettings.tabs.profile', { defaultValue: 'Profile' })}</span>
                </TabsTrigger>
                <TabsTrigger value="security" className="flex items-center gap-2">
                  <Shield className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('accountSettings.tabs.security', { defaultValue: 'Security' })}</span>
                </TabsTrigger>
                <TabsTrigger value="notifications" className="flex items-center gap-2">
                  <Bell className="h-4 w-4" />
                  <span className="hidden sm:inline">{t('accountSettings.tabs.notifications', { defaultValue: 'Notifications' })}</span>
                </TabsTrigger>
              </TabsList>

              {/* Profile Tab */}
              <TabsContent value="profile">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle>{t('accountSettings.profile.title', { defaultValue: 'Profile Information' })}</CardTitle>
                    <CardDescription>
                      Update your personal information and profile picture
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...profileForm}>
                      <form onSubmit={profileForm.handleSubmit(onSaveProfile)} className="space-y-6">
                        {/* Avatar */}
                        <div className="flex items-center gap-6">
                          <Avatar className="h-20 w-20">
                            <AvatarImage src={profileForm.watch('avatarUrl')} alt="Profile" />
                            <AvatarFallback className="text-lg bg-primary/10 text-primary">
                              {getInitials(profileForm.watch('fullName'))}
                            </AvatarFallback>
                          </Avatar>
                          <div className="space-y-2">
                            <FormField
                              control={profileForm.control}
                              name="avatarUrl"
                              render={({ field }) => (
                                <FormItem>
                                  <FormControl>
                                    <Input
                                      placeholder="https://example.com/avatar.jpg"
                                      {...field}
                                      className="max-w-xs"
                                    />
                                  </FormControl>
                                  <FormDescription className="text-xs">
                                    Enter a URL for your profile picture
                                  </FormDescription>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          </div>
                        </div>

                        {/* Full Name */}
                        <FormField
                          control={profileForm.control}
                          name="fullName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('accountSettings.profile.fullName', { defaultValue: 'Full Name' })}</FormLabel>
                              <FormControl>
                                <Input placeholder="John Doe" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        {/* Email (read-only) */}
                        <div className="space-y-2">
                          <label className="text-sm font-medium">
                            {t('accountSettings.profile.email', { defaultValue: 'Email Address' })}
                          </label>
                          <Input value={user?.email || ''} disabled className="bg-muted/50" />
                          <p className="text-xs text-muted-foreground">
                            Email cannot be changed for security reasons
                          </p>
                        </div>

                        <Button type="submit" disabled={isSavingProfile}>
                          {isSavingProfile ? 'Saving...' : t('accountSettings.profile.saveChanges', { defaultValue: 'Save Changes' })}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Security Tab */}
              <TabsContent value="security">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle>{t('accountSettings.security.title', { defaultValue: 'Security Settings' })}</CardTitle>
                    <CardDescription>
                      Manage your password and account security
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Change Password */}
                    <div className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
                      <div className="flex items-center gap-4">
                        <div className="p-2 rounded-full bg-primary/10">
                          <Lock className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <h4 className="font-medium">{t('accountSettings.security.changePassword', { defaultValue: 'Change Password' })}</h4>
                          <p className="text-sm text-muted-foreground">
                            {t('accountSettings.security.changePasswordDesc', { defaultValue: 'Update your password to keep your account secure' })}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline" onClick={() => navigate('/account/change-password')}>
                        Change
                      </Button>
                    </div>

                    {/* Last Sign In */}
                    {user?.last_sign_in_at && (
                      <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-full bg-green-500/10">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                          </div>
                          <div>
                            <h4 className="font-medium">{t('accountSettings.security.lastSignIn', { defaultValue: 'Last Sign In' })}</h4>
                            <p className="text-sm text-muted-foreground">
                              {new Date(user.last_sign_in_at).toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}

                    {/* Auth Provider */}
                    {user?.app_metadata?.provider && (
                      <div className="p-4 rounded-lg bg-muted/30 border border-border/50">
                        <div className="flex items-center gap-4">
                          <div className="p-2 rounded-full bg-blue-500/10">
                            <Shield className="h-5 w-5 text-blue-500" />
                          </div>
                          <div>
                            <h4 className="font-medium">Authentication Method</h4>
                            <p className="text-sm text-muted-foreground capitalize">
                              {user.app_metadata.provider}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications">
                <Card className="bg-card/50 backdrop-blur-sm border-border/50">
                  <CardHeader>
                    <CardTitle>{t('accountSettings.notifications.title', { defaultValue: 'Notification Preferences' })}</CardTitle>
                    <CardDescription>
                      Choose what updates you want to receive
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Form {...notificationsForm}>
                      <form onSubmit={notificationsForm.handleSubmit(onSaveNotifications)} className="space-y-6">
                        {/* Email Notifications */}
                        <FormField
                          control={notificationsForm.control}
                          name="emailNotifications"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base font-medium">
                                  {t('accountSettings.notifications.emailNotifications', { defaultValue: 'Email Notifications' })}
                                </FormLabel>
                                <FormDescription>
                                  {t('accountSettings.notifications.emailNotificationsDesc', { defaultValue: 'Receive important updates about your account' })}
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

                        {/* Order Updates */}
                        <FormField
                          control={notificationsForm.control}
                          name="orderUpdates"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base font-medium">
                                  {t('accountSettings.notifications.orderUpdates', { defaultValue: 'Order Updates' })}
                                </FormLabel>
                                <FormDescription>
                                  {t('accountSettings.notifications.orderUpdatesDesc', { defaultValue: 'Get notified about order status changes' })}
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

                        {/* Marketing */}
                        <FormField
                          control={notificationsForm.control}
                          name="marketing"
                          render={({ field }) => (
                            <FormItem className="flex items-center justify-between p-4 rounded-lg bg-muted/30 border border-border/50">
                              <div className="space-y-0.5">
                                <FormLabel className="text-base font-medium">
                                  {t('accountSettings.notifications.marketing', { defaultValue: 'Marketing Communications' })}
                                </FormLabel>
                                <FormDescription>
                                  {t('accountSettings.notifications.marketingDesc', { defaultValue: 'Receive news about new products and promotions' })}
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

                        <Button type="submit" disabled={isSavingNotifications}>
                          {isSavingNotifications ? 'Saving...' : t('accountSettings.notifications.savePreferences', { defaultValue: 'Save Preferences' })}
                        </Button>
                      </form>
                    </Form>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </motion.div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default AccountSettings;
