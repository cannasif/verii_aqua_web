import { type ReactElement, useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslation } from 'react-i18next';
import { Link } from 'react-router-dom';
import { Breadcrumb } from '@/components/ui/breadcrumb';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge'; // HATA FIX: Badge eklendi
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { userDetailFormSchema, type UserDetailFormSchema } from '../types/user-detail-types';
import { useUserDetailByUserId } from '../hooks/useUserDetailByUserId';
import { useCreateUserDetail } from '../hooks/useCreateUserDetail';
import { useUpdateUserDetail } from '../hooks/useUpdateUserDetail';
import { useUploadProfilePicture } from '../hooks/useUploadProfilePicture';
import { useAuthStore } from '@/stores/auth-store';
import { useUIStore } from '@/stores/ui-store';
import { toast } from 'sonner';
import { getImageUrl } from '../utils/image-url';
import { useChangePassword } from '@/features/auth/hooks/useChangePassword';
import { changePasswordSchema, type ChangePasswordRequest } from '@/features/auth/types/auth';
import {
  Shield,
  Camera,
  Save,
  Ruler,
  Weight,
  FileText,
  Mail,
  Lock,
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  Building2,
  Phone,
  Linkedin,
} from 'lucide-react';
import { cn } from '@/lib/utils';

export function ProfilePage(): ReactElement {
  const { t } = useTranslation();
  const { setPageTitle } = useUIStore();
  const { user, branch } = useAuthStore();
  const userId = user?.id || 0;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [isCurrentPasswordVisible, setIsCurrentPasswordVisible] = useState(false);
  const [isNewPasswordVisible, setIsNewPasswordVisible] = useState(false);

  const { data: userDetail, isLoading: isLoadingDetail, refetch: refetchUserDetail } = useUserDetailByUserId(userId);
  const createUserDetail = useCreateUserDetail();
  const updateUserDetail = useUpdateUserDetail();
  const uploadProfilePicture = useUploadProfilePicture();
  const changePassword = useChangePassword();

  const changePasswordForm = useForm<ChangePasswordRequest>({
    resolver: zodResolver(changePasswordSchema),
    defaultValues: { currentPassword: '', newPassword: '' },
  });

  const form = useForm<UserDetailFormSchema>({
    resolver: zodResolver(userDetailFormSchema),
    mode: 'onChange',
    defaultValues: {
      profilePictureUrl: '',
      height: undefined,
      weight: undefined,
      description: '',
      gender: undefined,
      linkedinUrl: '',
      phoneNumber: '',
      email: '',
    },
  });

  useEffect(() => {
    setPageTitle(t('userDetailManagement.profilePageTitle'));
    return () => setPageTitle(null);
  }, [t, setPageTitle]);

  useEffect(() => {
    if (userDetail) {
      form.reset({
        profilePictureUrl: userDetail.profilePictureUrl ?? '',
        height: userDetail.height ?? undefined,
        weight: userDetail.weight ?? undefined,
        description: userDetail.description ?? '',
        gender: userDetail.gender ?? undefined,
        linkedinUrl: userDetail.linkedinUrl ?? '',
        phoneNumber: userDetail.phoneNumber ?? '',
        email: userDetail.email ?? '',
      });
      setPreviewUrl(userDetail.profilePictureUrl ? getImageUrl(userDetail.profilePictureUrl) : null);
    }
  }, [userDetail, form]);

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>): Promise<void> => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.error(t('userDetailManagement.fileSizeError'));
      return;
    }
    const reader = new FileReader();
    reader.onloadend = () => setPreviewUrl(reader.result as string);
    reader.readAsDataURL(file);

    try {
      const result = await uploadProfilePicture.mutateAsync({ userId, file });
      await refetchUserDetail();
      if (result?.profilePictureUrl) {
        form.setValue('profilePictureUrl', result.profilePictureUrl);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleSubmit = async (data: UserDetailFormSchema): Promise<void> => {
    // HATA FIX: null değerler undefined yapılarak DTO tip uyumsuzluğu çözüldü
    const payload = {
      profilePictureUrl: data.profilePictureUrl ?? undefined,
      height: data.height ?? undefined,
      weight: data.weight ?? undefined,
      description: data.description ?? undefined,
      gender: data.gender ?? undefined,
      linkedinUrl: data.linkedinUrl ?? undefined,
      phoneNumber: data.phoneNumber ?? undefined,
      email: data.email ?? undefined,
    };

    if (userDetail) {
      await updateUserDetail.mutateAsync({ id: userDetail.id, data: payload });
    } else {
      await createUserDetail.mutateAsync({ userId, ...payload });
    }
    toast.success(t('userDetailManagement.saveSuccess'));
  };

  const handleChangePasswordSubmit = async (data: ChangePasswordRequest): Promise<void> => {
    await changePassword.mutateAsync(data);
    changePasswordForm.reset();
  };

  if (isLoadingDetail) {
    return (
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="h-8 w-8 animate-spin text-cyan-500" />
      </div>
    );
  }

  const isSaving = createUserDetail.isPending || updateUserDetail.isPending;
  const isChangingPassword = changePassword.isPending;
  const displayName = user?.name || user?.email || t('welcome.userFallback');

  const inputStyle = "pl-10 h-11 bg-slate-50 dark:bg-blue-950/40 border-slate-200 dark:border-cyan-800/30 text-slate-900 dark:text-white focus-visible:ring-cyan-500/20 focus-visible:border-cyan-500 rounded-xl transition-all duration-200";
  const labelStyle = "text-[10px] font-bold uppercase tracking-widest text-slate-500 dark:text-slate-400 ml-1";

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6 sm:space-y-8 pb-10 animate-in fade-in duration-500">
      <Breadcrumb items={[{ label: t('sidebar.home', { ns: 'common' }) }, { label: t('userDetailManagement.profilePageTitle'), isActive: true }]} />

      <Link to="/" className="inline-flex items-center gap-2 text-sm font-bold text-slate-500 hover:text-cyan-600 dark:hover:text-cyan-400 transition-colors">
        <ArrowLeft size={16} />
        {t('userDetailManagement.backToHome')}
      </Link>

      <section className="rounded-3xl border bg-white dark:bg-blue-950/60 backdrop-blur-xl border-slate-200 dark:border-cyan-800/30 p-6 sm:p-8 shadow-sm relative overflow-hidden group">
        <div className="flex flex-col sm:flex-row sm:items-center gap-6 sm:gap-8 relative z-10">
          <button type="button" onClick={() => fileInputRef.current?.click()} className="relative group shrink-0 self-center sm:self-auto">
            <div className="w-28 h-28 rounded-full border-4 border-white dark:border-cyan-900 bg-slate-100 dark:bg-blue-900 overflow-hidden shadow-xl ring-4 ring-cyan-500/10 transition-all group-hover:ring-cyan-500/30">
              {previewUrl ? (
                <img src={previewUrl} alt="" className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-4xl font-black text-white bg-linear-to-br from-cyan-500 to-blue-600 uppercase">
                  {displayName[0]}
                </div>
              )}
              <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-full">
                <Camera size={24} className="text-white" />
              </div>
            </div>
            <input ref={fileInputRef} type="file" accept="image/*" onChange={handleFileChange} className="sr-only" />
          </button>

          <div className="flex-1 min-w-0 text-center sm:text-left space-y-2">
            <h1 className="text-3xl font-black tracking-tight text-slate-900 dark:text-white truncate">{displayName}</h1>
            <div className="flex flex-wrap justify-center sm:justify-start gap-3">
              <Badge variant="outline" className="bg-cyan-50 dark:bg-cyan-900/30 border-cyan-100 dark:border-cyan-800/50 text-cyan-700 dark:text-cyan-400 font-bold px-3 py-1 rounded-lg">
                <Mail size={12} className="mr-2" /> {user?.email}
              </Badge>
              {branch?.name && (
                <Badge variant="outline" className="bg-slate-100 dark:bg-blue-900/30 border-slate-200 dark:border-cyan-800/20 text-slate-600 dark:text-slate-300 font-bold px-3 py-1 rounded-lg">
                  <Building2 size={12} className="mr-2" /> {branch.name}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </section>

      <Card className="bg-white dark:bg-blue-950/60 backdrop-blur-xl border-slate-200 dark:border-cyan-800/30 shadow-sm rounded-3xl overflow-hidden">
        <CardHeader className="border-b border-slate-100 dark:border-cyan-800/20 bg-slate-50/50 dark:bg-blue-900/10">
          <CardTitle className="text-xl font-bold text-slate-900 dark:text-white">{t('userDetailManagement.personalInfo')}</CardTitle>
          <CardDescription className="font-medium">{t('userDetailManagement.personalInfoDescription')}</CardDescription>
        </CardHeader>
        <CardContent className="pt-8">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} noValidate className="space-y-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField control={form.control} name="height" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelStyle}><Ruler size={12} className="inline mr-1" /> {t('userDetailManagement.height')}</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-500 transition-colors size-4" />
                        <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} value={field.value ?? ''} className={inputStyle} />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500 text-xs" />
                  </FormItem>
                )} />
                <FormField control={form.control} name="weight" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelStyle}><Weight size={12} className="inline mr-1" /> {t('userDetailManagement.weight')}</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Weight className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-500 transition-colors size-4" />
                        <Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(e.target.value ? parseFloat(e.target.value) : undefined)} value={field.value ?? ''} className={inputStyle} />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500 text-xs" />
                  </FormItem>
                )} />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <FormField control={form.control} name="phoneNumber" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelStyle}><Phone size={12} className="inline mr-1" /> {t('userDetailManagement.phoneNumber')}</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-500 transition-colors size-4" />
                        <Input type="text" {...field} value={field.value ?? ''} className={inputStyle} />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500 text-xs" />
                  </FormItem>
                )} />
                <FormField control={form.control} name="linkedinUrl" render={({ field }) => (
                  <FormItem>
                    <FormLabel className={labelStyle}><Linkedin size={12} className="inline mr-1" /> LinkedIn</FormLabel>
                    <FormControl>
                      <div className="relative group">
                        <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-cyan-500 transition-colors size-4" />
                        <Input type="url" {...field} value={field.value ?? ''} className={inputStyle} />
                      </div>
                    </FormControl>
                    <FormMessage className="text-red-500 text-xs" />
                  </FormItem>
                )} />
              </div>

              <FormField control={form.control} name="description" render={({ field }) => (
                <FormItem>
                  <FormLabel className={labelStyle}><FileText size={12} className="inline mr-1" /> {t('userDetailManagement.description')}</FormLabel>
                  <FormControl>
                    <div className="relative group">
                      <FileText className="absolute left-3 top-3 text-slate-400 group-focus-within:text-cyan-500 transition-colors size-4" />
                      <Textarea {...field} value={field.value ?? ''} rows={4} className={cn(inputStyle, "pl-10 min-h-[120px] py-3 resize-none")} />
                    </div>
                  </FormControl>
                  <FormMessage className="text-red-500 text-xs" />
                </FormItem>
              )} />

              <div className="flex justify-end pt-4">
                <Button type="submit" disabled={isSaving || !form.formState.isValid} className="bg-linear-to-r from-cyan-600 to-blue-600 text-white font-extrabold h-11 px-10 rounded-xl shadow-lg border-0">
                  {isSaving ? <Loader2 size={18} className="animate-spin mr-2" /> : <Save size={18} className="mr-2" />}
                  {isSaving ? t('userDetailManagement.saving') : t('userDetailManagement.save')}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      <Card className="bg-white dark:bg-blue-950/60 backdrop-blur-xl border-slate-200 dark:border-cyan-800/30 shadow-sm rounded-3xl transition-all duration-300">
        <CardHeader>
          <CardTitle className="text-xl font-bold flex items-center gap-2">
            <Shield size={20} className="text-cyan-600 dark:text-cyan-400" />
            {t('userDetailManagement.security')}
          </CardTitle>
          <CardDescription>{t('userDetailManagement.securityDescription')}</CardDescription>
        </CardHeader>
        <CardContent>
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="change-password" title="parola degistir" className="border-none">
              <AccordionTrigger className="py-4 px-4 hover:no-underline hover:bg-slate-50 dark:hover:bg-blue-900/20 rounded-2xl transition-all data-[state=open]:bg-slate-50 dark:data-[state=open]:bg-blue-900/20">
                <div className="flex items-center gap-4 font-bold">
                  <div className="p-2.5 rounded-xl bg-slate-100 dark:bg-blue-900">
                    <Lock size={18} className="text-slate-500 dark:text-slate-400" />
                  </div>
                  {t('userDetailManagement.changePassword')}
                </div>
              </AccordionTrigger>
              <AccordionContent className="pt-6 pb-2 px-4">
                <Form {...changePasswordForm}>
                  <form onSubmit={changePasswordForm.handleSubmit(handleChangePasswordSubmit)} noValidate className="space-y-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                      <FormField control={changePasswordForm.control} name="currentPassword" render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelStyle}>{t('userDetailManagement.currentPassword')}</FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                              <Input {...field} type={isCurrentPasswordVisible ? 'text' : 'password'} className={inputStyle} />
                              <button type="button" onClick={() => setIsCurrentPasswordVisible(!isCurrentPasswordVisible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-600 transition-colors">
                                {isCurrentPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-500 text-xs" />
                        </FormItem>
                      )} />
                      <FormField control={changePasswordForm.control} name="newPassword" render={({ field }) => (
                        <FormItem>
                          <FormLabel className={labelStyle}>{t('userDetailManagement.newPassword')}</FormLabel>
                          <FormControl>
                            <div className="relative group">
                              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 size-4" />
                              <Input {...field} type={isNewPasswordVisible ? 'text' : 'password'} className={inputStyle} />
                              <button type="button" onClick={() => setIsNewPasswordVisible(!isNewPasswordVisible)} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-cyan-600 transition-colors">
                                {isNewPasswordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
                              </button>
                            </div>
                          </FormControl>
                          <FormMessage className="text-red-500 text-xs" />
                        </FormItem>
                      )} />
                    </div>
                    <div className="flex justify-end pt-2">
                      <Button type="submit" disabled={isChangingPassword} variant="outline" className="border-cyan-600/50 text-cyan-700 dark:text-cyan-400 font-bold px-8 rounded-xl">
                        {isChangingPassword ? <Loader2 size={16} className="animate-spin mr-2" /> : <Shield size={16} className="mr-2" />}
                        {isChangingPassword ? t('userDetailManagement.changingPassword') : t('userDetailManagement.changePasswordButton')}
                      </Button>
                    </div>
                  </form>
                </Form>
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </CardContent>
      </Card>
    </div>
  );
}
