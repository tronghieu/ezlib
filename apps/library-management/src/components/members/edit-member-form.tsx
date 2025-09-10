"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { 
  ArrowLeft, 
  Loader2, 
  Save, 
  RotateCcw, 
  User, 
  IdCard, 
  UserCog,
  Trash2 
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { 
  useMemberProfile, 
  useUpdateMember, 
  useUpdateMemberStatus,
  useDeleteMember 
} from "@/lib/hooks/use-members";
import { 
  memberUpdateSchema, 
  type MemberUpdateData 
} from "@/lib/validation/members";
import type { MemberStatus, MembershipType } from "@/types/members";
interface EditMemberFormProps {
  memberId: string;
  libraryId: string;
  libraryCode: string;
}

export function EditMemberForm({ memberId, libraryId, libraryCode }: EditMemberFormProps) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);
  
  const { data: member, isLoading, error } = useMemberProfile(libraryId, memberId);
  const updateMemberMutation = useUpdateMember(libraryId);
  const updateStatusMutation = useUpdateMemberStatus(libraryId);
  const deleteMemberMutation = useDeleteMember(libraryId);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting, isDirty },
    setValue,
    watch,
    reset,
  } = useForm<MemberUpdateData>({
    resolver: zodResolver(memberUpdateSchema),
  });

  // Initialize form with member data when loaded
  React.useEffect(() => {
    if (member) {
      reset({
        first_name: member.personal_info.first_name,
        last_name: member.personal_info.last_name,
        email: member.personal_info.email,
        phone: member.personal_info.phone || "",
        street: member.personal_info.address?.street || "",
        city: member.personal_info.address?.city || "",
        state: member.personal_info.address?.state || "",
        country: member.personal_info.address?.country || "",
        postal_code: member.personal_info.address?.postal_code || "",
        membership_type: member.membership_info.type,
        membership_notes: member.membership_info.notes || "",
      });
    }
  }, [member, reset]);

  const onSubmit = async (data: MemberUpdateData) => {
    try {
      await updateMemberMutation.mutateAsync({ memberId, data });
      toast.success("Member updated successfully!");
      router.push(`/${libraryCode}/members/${memberId}`);
    } catch (error) {
      console.error("Failed to update member:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update member");
    }
  };

  const handleStatusChange = async (newStatus: MemberStatus) => {
    try {
      await updateStatusMutation.mutateAsync({ memberId, status: newStatus });
      // Status is updated via the API, form data will be refreshed via React Query
    } catch (error) {
      console.error("Failed to update member status:", error);
      toast.error(error instanceof Error ? error.message : "Failed to update status");
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteMemberMutation.mutateAsync({
        memberId,
        deletedBy: "current-user-id", // TODO: Get actual user ID
      });
      toast.success("Member deleted successfully!");
      router.push(`/${libraryCode}/members`);
    } catch (error) {
      console.error("Failed to delete member:", error);
      toast.error(error instanceof Error ? error.message : "Failed to delete member");
      setIsDeleting(false);
    }
  };

  if (isLoading) {
    return <EditMemberFormSkeleton />;
  }

  if (error || !member) {
    return (
      <div className="text-center py-12">
        <User className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-xl font-semibold mb-2">Member Not Found</h2>
        <p className="text-muted-foreground mb-6">
          The member you&apos;re trying to edit doesn&apos;t exist or has been removed.
        </p>
        <Button asChild>
          <Link href={`/${libraryCode}/members`}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Members
          </Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Breadcrumb Navigation */}
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/${libraryCode}/dashboard`}>Dashboard</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/${libraryCode}/members`}>Members</Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbLink asChild>
              <Link href={`/${libraryCode}/members/${memberId}`}>
                {member.personal_info.first_name} {member.personal_info.last_name}
              </Link>
            </BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbPage>Edit</BreadcrumbPage>
        </BreadcrumbList>
      </Breadcrumb>

      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-6">
        <div className="space-y-4">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href={`/${libraryCode}/members/${memberId}`}>
                <ArrowLeft className="h-4 w-4" />
                Back to Profile
              </Link>
            </Button>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center gap-4">
              <h1 className="text-3xl font-bold tracking-tight">
                Edit Member
              </h1>
              <Badge variant="secondary">
                {member.member_id}
              </Badge>
            </div>
            <p className="text-muted-foreground">
              Update member personal information and membership details
            </p>
          </div>
        </div>

        {/* Status Controls */}
        <div className="flex gap-2">
          <StatusSelect
            currentStatus={member.status}
            onStatusChange={handleStatusChange}
            isUpdating={updateStatusMutation.isPending}
          />
        </div>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Main Form Content */}
          <div className="lg:col-span-2 space-y-6">
            <PersonalInfoSection register={register} errors={errors} />
            <AddressSection register={register} errors={errors} />
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            <MembershipInfoSection 
              register={register} 
              errors={errors}
              setValue={setValue}
              watch={watch}
            />
            
            <ActionButtons
              isDirty={isDirty}
              isSubmitting={isSubmitting}
              onReset={() => reset()}
              onDelete={handleDelete}
              isDeleting={isDeleting}
              libraryCode={libraryCode}
              memberId={memberId}
            />
          </div>
        </div>
      </form>
    </div>
  );
}

// Personal Information Section
function PersonalInfoSection({ 
  register, 
  errors 
}: { 
  register: ReturnType<typeof useForm>["register"]; 
  errors: ReturnType<typeof useForm>["formState"]["errors"]; 
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <User className="h-5 w-5" />
          Personal Information
        </CardTitle>
        <CardDescription>
          Update the member&apos;s basic contact information
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="first_name">First Name *</Label>
          <Input
            id="first_name"
            {...register("first_name")}
            placeholder="Enter first name"
          />
          {errors.first_name && (
            <p className="text-sm text-destructive">{errors.first_name.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="last_name">Last Name *</Label>
          <Input
            id="last_name"
            {...register("last_name")}
            placeholder="Enter last name"
          />
          {errors.last_name && (
            <p className="text-sm text-destructive">{errors.last_name.message as string}</p>
          )}
        </div>

        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="email">Email Address *</Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="member@example.com"
          />
          {errors.email && (
            <p className="text-sm text-destructive">{errors.email.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone Number</Label>
          <Input
            id="phone"
            type="tel"
            {...register("phone")}
            placeholder="Enter phone number"
          />
          {errors.phone && (
            <p className="text-sm text-destructive">{errors.phone.message as string}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Address Section
function AddressSection({ 
  register, 
  errors 
}: { 
  register: ReturnType<typeof useForm>["register"]; 
  errors: ReturnType<typeof useForm>["formState"]["errors"]; 
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Address Information</CardTitle>
        <CardDescription>
          Optional address details for the member
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4 md:grid-cols-2">
        <div className="space-y-2 md:col-span-2">
          <Label htmlFor="street">Street Address</Label>
          <Input
            id="street"
            {...register("street")}
            placeholder="Enter street address"
          />
          {errors.street && (
            <p className="text-sm text-destructive">{errors.street.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="city">City</Label>
          <Input
            id="city"
            {...register("city")}
            placeholder="Enter city"
          />
          {errors.city && (
            <p className="text-sm text-destructive">{errors.city.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="state">State/Province</Label>
          <Input
            id="state"
            {...register("state")}
            placeholder="Enter state or province"
          />
          {errors.state && (
            <p className="text-sm text-destructive">{errors.state.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="country">Country</Label>
          <Input
            id="country"
            {...register("country")}
            placeholder="Enter country"
          />
          {errors.country && (
            <p className="text-sm text-destructive">{errors.country.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="postal_code">Postal Code</Label>
          <Input
            id="postal_code"
            {...register("postal_code")}
            placeholder="Enter postal code"
          />
          {errors.postal_code && (
            <p className="text-sm text-destructive">{errors.postal_code.message as string}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Membership Info Section
function MembershipInfoSection({ 
  register, 
  errors,
  setValue,
  watch,
}: { 
  register: ReturnType<typeof useForm>["register"]; 
  errors: ReturnType<typeof useForm>["formState"]["errors"];
  setValue: ReturnType<typeof useForm>["setValue"];
  watch: ReturnType<typeof useForm>["watch"];
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <IdCard className="h-5 w-5" />
          Membership Details
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="membership_type">Membership Type</Label>
          <Select
            value={watch("membership_type")}
            onValueChange={(value: MembershipType) => setValue("membership_type", value)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="regular">Regular</SelectItem>
              <SelectItem value="student">Student</SelectItem>
              <SelectItem value="senior">Senior</SelectItem>
            </SelectContent>
          </Select>
          {errors.membership_type && (
            <p className="text-sm text-destructive">{errors.membership_type.message as string}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="membership_notes">Membership Notes</Label>
          <Textarea
            id="membership_notes"
            {...register("membership_notes")}
            placeholder="Optional notes about this membership..."
            rows={3}
          />
          {errors.membership_notes && (
            <p className="text-sm text-destructive">{errors.membership_notes.message as string}</p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// Status Select Component
function StatusSelect({
  currentStatus,
  onStatusChange,
  isUpdating,
}: {
  currentStatus: MemberStatus;
  onStatusChange: (status: MemberStatus) => void;
  isUpdating: boolean;
}) {
  return (
    <div className="flex items-center gap-2">
      <Label htmlFor="status" className="text-sm">Status:</Label>
      <Select
        value={currentStatus}
        onValueChange={(value: MemberStatus) => onStatusChange(value)}
        disabled={isUpdating}
      >
        <SelectTrigger className="w-32">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="active">Active</SelectItem>
          <SelectItem value="inactive">Inactive</SelectItem>
          <SelectItem value="banned">Banned</SelectItem>
        </SelectContent>
      </Select>
      {isUpdating && <Loader2 className="h-4 w-4 animate-spin" />}
    </div>
  );
}

// Action Buttons Component
function ActionButtons({
  isDirty,
  isSubmitting,
  onReset,
  onDelete,
  isDeleting,
}: {
  isDirty: boolean;
  isSubmitting: boolean;
  onReset: () => void;
  onDelete: () => void;
  isDeleting: boolean;
  libraryCode: string;
  memberId: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <UserCog className="h-5 w-5" />
          Actions
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Button 
            type="submit" 
            disabled={!isDirty || isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="h-4 w-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>

        <div className="flex gap-2">
          <Button 
            type="button" 
            variant="outline" 
            onClick={onReset}
            disabled={!isDirty || isSubmitting}
            className="flex-1"
          >
            <RotateCcw className="h-4 w-4 mr-2" />
            Reset
          </Button>
        </div>

        <Separator />

        <AlertDialog>
          <AlertDialogTrigger asChild>
            <Button variant="destructive" size="sm" className="w-full">
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Member
            </Button>
          </AlertDialogTrigger>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete Member</AlertDialogTitle>
              <AlertDialogDescription>
                Are you sure you want to delete this member? This action cannot be undone.
                The member&apos;s checkout history will be preserved, but they will no longer
                be able to borrow books.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={onDelete}
                disabled={isDeleting}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                {isDeleting ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Member
                  </>
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </CardContent>
    </Card>
  );
}

// Loading Skeleton
function EditMemberFormSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-4 w-64 bg-muted animate-pulse rounded" />
      <div className="space-y-4">
        <div className="h-8 w-48 bg-muted animate-pulse rounded" />
        <div className="h-4 w-96 bg-muted animate-pulse rounded" />
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <div className="h-64 bg-muted animate-pulse rounded-lg" />
          <div className="h-48 bg-muted animate-pulse rounded-lg" />
        </div>
        <div className="space-y-6">
          <div className="h-48 bg-muted animate-pulse rounded-lg" />
          <div className="h-32 bg-muted animate-pulse rounded-lg" />
        </div>
      </div>
    </div>
  );
}