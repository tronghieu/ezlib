/**
 * Member validation schemas using Zod
 * For form validation and type safety
 */

import { z } from "zod";

// Base member schema without transform
const baseMemberSchema = z.object({
  member_id: z
    .string()
    .max(20, "Member ID must be less than 20 characters")
    .regex(
      /^[A-Za-z0-9-_]{1,20}$/,
      "Member ID can only contain letters, numbers, hyphens, and underscores"
    )
    .optional(), // Optional for automatic generation
  first_name: z
    .string()
    .min(1, "First name is required")
    .max(50, "First name must be less than 50 characters")
    .regex(
      /^[A-Za-z\s\-'\.]+$/,
      "First name can only contain letters, spaces, hyphens, and apostrophes"
    ),
  last_name: z
    .string()
    .min(1, "Last name is required")
    .max(50, "Last name must be less than 50 characters")
    .regex(
      /^[A-Za-z\s\-'\.]+$/,
      "Last name can only contain letters, spaces, hyphens, and apostrophes"
    ),
  email: z
    .email("Please enter a valid email address")
    .min(1, "Email is required")
    .max(100, "Email must be less than 100 characters"),
  phone: z
    .string()
    .regex(/^[\+]?[1-9][\d]{0,15}$/, "Please enter a valid phone number")
    .optional()
    .or(z.literal("")),
  
  // Support both flat fields (for forms) AND nested objects (for API consistency)
  street: z
    .string()
    .max(100, "Street address must be less than 100 characters")
    .optional()
    .or(z.literal("")),
  city: z
    .string()
    .max(50, "City must be less than 50 characters")
    .optional()
    .or(z.literal("")),
  state: z
    .string()
    .max(50, "State must be less than 50 characters")
    .optional()
    .or(z.literal("")),
  country: z
    .string()
    .max(50, "Country must be less than 50 characters")
    .optional()
    .or(z.literal("")),
  postal_code: z
    .string()
    .max(20, "Postal code must be less than 20 characters")
    .optional()
    .or(z.literal("")),

  // Nested structure support for API backwards compatibility
  address: z
    .object({
      street: z
        .string()
        .max(100, "Street address must be less than 100 characters")
        .optional(),
      city: z
        .string()
        .max(50, "City must be less than 50 characters")
        .optional(),
      state: z
        .string()
        .max(50, "State must be less than 50 characters")
        .optional(),
      country: z
        .string()
        .max(50, "Country must be less than 50 characters")
        .optional(),
      postal_code: z
        .string()
        .max(20, "Postal code must be less than 20 characters")
        .optional(),
    })
    .optional(),
  membership_type: z.enum(["regular", "student", "senior"]),
  membership_notes: z
    .string()
    .max(500, "Membership notes must be less than 500 characters")
    .optional(),
});

// Member registration schema
export const memberRegistrationSchema = baseMemberSchema.transform((data) => {
  // Transform nested structures to flat fields if needed for forms
  if (data.address?.street && !data.street) {
    data.street = data.address.street;
  }
  if (data.address?.city && !data.city) {
    data.city = data.address.city;
  }
  if (data.address?.state && !data.state) {
    data.state = data.address.state;
  }
  if (data.address?.country && !data.country) {
    data.country = data.address.country;
  }
  if (data.address?.postal_code && !data.postal_code) {
    data.postal_code = data.address.postal_code;
  }
  return data;
});

// Member update schema (all fields optional, includes status)
export const memberUpdateSchema = baseMemberSchema.partial().extend({
  status: z.enum(["active", "inactive", "banned"]).optional(),
});

// Member search schema
export const memberSearchSchema = z.object({
  search: z.string().optional(),
  status: z.enum(["active", "inactive", "banned"]).optional(),
  membership_type: z.enum(["regular", "student", "senior"]).optional(),
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(20),
});

// Member status update schema
export const memberStatusUpdateSchema = z.object({
  status: z.enum(["active", "inactive", "banned"]),
});

// Invitation schema
export const invitationCreateSchema = z.object({
  email: z
    .email("Please enter a valid email address")
    .min(1, "Email is required")
    .max(100, "Email must be less than 100 characters"),
  role: z.string().min(1, "Role is required"),
  invitation_type: z.enum(["library_member", "library_staff"]),
  personal_message: z
    .string()
    .max(500, "Personal message must be less than 500 characters")
    .optional(),
  invitation_reason: z
    .string()
    .max(200, "Invitation reason must be less than 200 characters")
    .optional(),
});

// Type exports
export type MemberRegistrationData = z.infer<typeof memberRegistrationSchema>;
export type MemberUpdateData = z.infer<typeof memberUpdateSchema>;
export type MemberSearchData = z.infer<typeof memberSearchSchema>;
export type MemberStatusUpdateData = z.infer<typeof memberStatusUpdateSchema>;
export type InvitationCreateData = z.infer<typeof invitationCreateSchema>;
