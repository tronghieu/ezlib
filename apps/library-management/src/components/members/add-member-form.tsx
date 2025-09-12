"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  Loader2,
  Plus,
  RotateCcw,
  ToggleLeft,
  ToggleRight,
} from "lucide-react";
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
import { Separator } from "@/components/ui/separator";
import { useCreateMember } from "@/lib/hooks/use-members";
import {
  memberRegistrationSchema,
  type MemberRegistrationData,
} from "@/lib/validation/members";

interface AddMemberFormProps {
  libraryId: string;
  libraryCode: string;
  userId: string;
  userName: string;
}

export function AddMemberForm({
  libraryId,
  libraryCode,
  userId,
  userName,
}: AddMemberFormProps) {
  const router = useRouter();
  const [useManualId, setUseManualId] = useState(false);
  const [showAddAnother, setShowAddAnother] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    setValue,
    watch,
    reset,
  } = useForm<MemberRegistrationData>({
    resolver: zodResolver(memberRegistrationSchema),
    defaultValues: {
      membership_type: "regular" as const,
    },
  });

  const createMemberMutation = useCreateMember(libraryId);

  const onSubmit = async (data: MemberRegistrationData) => {
    try {
      // If not using manual ID, remove the member_id field to trigger auto-generation
      const submissionData = useManualId
        ? data
        : { ...data, member_id: undefined };

      const newMember = await createMemberMutation.mutateAsync({
        ...submissionData,
        inviterUserId: userId,
        inviterName: userName,
      });

      toast.success(
        <div className="flex flex-col gap-1">
          <p className="font-medium">Member registered successfully!</p>
          <p className="text-sm text-muted-foreground">
            Member ID: {newMember.member_id}
          </p>
        </div>
      );

      // Show success options
      setShowAddAnother(true);

      // Reset form for potential next member
      reset({
        membership_type: "regular",
      });
    } catch (error) {
      console.error("Failed to register member:", error);
    }
  };

  const handleAddAnother = () => {
    setShowAddAnother(false);
    setUseManualId(false);
  };

  const handleViewMembers = () => {
    router.push(`/${libraryCode}/members`);
  };

  // Show success state
  if (showAddAnother) {
    return (
      <div className="text-center py-8">
        <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Plus className="h-8 w-8 text-green-600" />
        </div>
        <h3 className="text-lg font-semibold mb-2">
          Member Added Successfully!
        </h3>
        <p className="text-muted-foreground mb-6">
          The new member has been registered and can now borrow books.
        </p>
        <div className="flex gap-3 justify-center">
          <Button onClick={handleAddAnother} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Another Member
          </Button>
          <Button variant="outline" onClick={handleViewMembers}>
            View All Members
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* Member ID Option */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label className="text-base font-medium">Member ID</Label>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setUseManualId(!useManualId)}
            className="gap-2 h-8 px-3"
          >
            {useManualId ? (
              <>
                <ToggleRight className="h-4 w-4 text-blue-600" />
                Manual
              </>
            ) : (
              <>
                <ToggleLeft className="h-4 w-4 text-muted-foreground" />
                Auto-generate
              </>
            )}
          </Button>
        </div>

        {useManualId ? (
          <div className="space-y-2">
            <Input
              {...register("member_id")}
              placeholder="Enter member ID (e.g., M001, CARD-12345)"
              className={errors.member_id ? "border-red-500" : ""}
            />
            {errors.member_id && (
              <p className="text-sm text-red-600">{errors.member_id.message}</p>
            )}
            <p className="text-xs text-muted-foreground">
              Use a unique identifier for this member (max 20 characters)
            </p>
          </div>
        ) : (
          <div className="p-3 bg-muted/50 rounded-lg">
            <p className="text-sm text-muted-foreground">
              Member ID will be automatically generated (M001, M002, etc.)
            </p>
          </div>
        )}
      </div>

      <Separator />

      {/* Membership Information */}
      <div className="space-y-4">
        <h3 className="text-base font-medium">Membership Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Membership Type</Label>
            <Select
              value={watch("membership_type")}
              onValueChange={(value) =>
                setValue(
                  "membership_type",
                  value as "regular" | "student" | "senior"
                )
              }
            >
              <SelectTrigger
                className={errors.membership_type ? "border-red-500" : ""}
              >
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="regular">Regular</SelectItem>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="senior">Senior</SelectItem>
              </SelectContent>
            </Select>
            {errors.membership_type && (
              <p className="text-sm text-red-600">
                {errors.membership_type.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="membership_notes">Notes (optional)</Label>
            <Textarea
              id="membership_notes"
              {...register("membership_notes")}
              placeholder="Additional notes about the member..."
              rows={3}
              className={errors.membership_notes ? "border-red-500" : ""}
            />
            {errors.membership_notes && (
              <p className="text-sm text-red-600">
                {errors.membership_notes.message}
              </p>
            )}
          </div>
        </div>
      </div>

      <Separator />

      {/* Personal Information */}
      <div className="space-y-4">
        <h3 className="text-base font-medium">Personal Information</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="first_name">
              First Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="first_name"
              {...register("first_name")}
              placeholder="John"
              className={errors.first_name ? "border-red-500" : ""}
            />
            {errors.first_name && (
              <p className="text-sm text-red-600">
                {errors.first_name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="last_name">
              Last Name <span className="text-red-500">*</span>
            </Label>
            <Input
              id="last_name"
              {...register("last_name")}
              placeholder="Doe"
              className={errors.last_name ? "border-red-500" : ""}
            />
            {errors.last_name && (
              <p className="text-sm text-red-600">{errors.last_name.message}</p>
            )}
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email">
            Email <span className="text-red-500">*</span>
          </Label>
          <Input
            id="email"
            type="email"
            {...register("email")}
            placeholder="john.doe@example.com"
            className={errors.email ? "border-red-500" : ""}
          />
          {errors.email && (
            <p className="text-sm text-red-600">{errors.email.message}</p>
          )}
        </div>

        <div className="space-y-2">
          <Label htmlFor="phone">Phone (optional)</Label>
          <Input
            id="phone"
            type="tel"
            {...register("phone")}
            placeholder="+1 (555) 123-4567"
            className={errors.phone ? "border-red-500" : ""}
          />
          {errors.phone && (
            <p className="text-sm text-red-600">{errors.phone.message}</p>
          )}
        </div>
      </div>

      <Separator />

      {/* Address Information */}
      <div className="space-y-4">
        <h3 className="text-base font-medium">Address (Optional)</h3>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="address.street">Street Address</Label>
            <Input
              id="address.street"
              {...register("address.street")}
              placeholder="123 Main Street"
              className={errors.address?.street ? "border-red-500" : ""}
            />
            {errors.address?.street && (
              <p className="text-sm text-red-600">
                {errors.address.street.message}
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address.city">City</Label>
              <Input
                id="address.city"
                {...register("address.city")}
                placeholder="New York"
                className={errors.address?.city ? "border-red-500" : ""}
              />
              {errors.address?.city && (
                <p className="text-sm text-red-600">
                  {errors.address.city.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address.state">State/Province</Label>
              <Input
                id="address.state"
                {...register("address.state")}
                placeholder="NY"
                className={errors.address?.state ? "border-red-500" : ""}
              />
              {errors.address?.state && (
                <p className="text-sm text-red-600">
                  {errors.address.state.message}
                </p>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="address.country">Country</Label>
              <Input
                id="address.country"
                {...register("address.country")}
                placeholder="United States"
                className={errors.address?.country ? "border-red-500" : ""}
              />
              {errors.address?.country && (
                <p className="text-sm text-red-600">
                  {errors.address.country.message}
                </p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="address.postal_code">Postal Code</Label>
              <Input
                id="address.postal_code"
                {...register("address.postal_code")}
                placeholder="10001"
                className={errors.address?.postal_code ? "border-red-500" : ""}
              />
              {errors.address?.postal_code && (
                <p className="text-sm text-red-600">
                  {errors.address.postal_code.message}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Separator />

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 justify-end">
        <Button type="submit" disabled={isSubmitting} className="gap-2">
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          Register Member
        </Button>

        <Button
          type="button"
          variant="outline"
          onClick={() => router.push(`/${libraryCode}/members`)}
          disabled={isSubmitting}
        >
          Cancel
        </Button>

        <Button
          type="button"
          variant="ghost"
          onClick={() => reset({ membership_type: "regular" })}
          disabled={isSubmitting}
          className="gap-2"
        >
          <RotateCcw className="h-4 w-4" />
          Reset
        </Button>
      </div>

      {/* Status Information */}
      <div className="text-xs text-muted-foreground pt-2 border-t">
        <p>
          • All new members are automatically set to &ldquo;active&rdquo; status
        </p>
        <p>• An invitation will be sent to the member&apos;s email address</p>
        <p>• Members can immediately begin borrowing books</p>
      </div>
    </form>
  );
}
