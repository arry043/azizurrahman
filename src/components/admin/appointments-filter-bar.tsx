"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useTransition, useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { AppointmentStatus } from "@/types/domain";

interface FilterBarProps {
  initialSearch?: string;
  initialStatus?: AppointmentStatus | "all";
  initialDate?: string;
}

export function AppointmentsFilterBar({
  initialSearch = "",
  initialStatus = "all",
  initialDate = "",
}: FilterBarProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState<string>(initialStatus);
  const [date, setDate] = useState(initialDate);

  function applyFilters(newSearch: string, newStatus: string, newDate: string) {
    const params = new URLSearchParams(searchParams.toString());

    if (newSearch.trim()) {
      params.set("search", newSearch.trim());
    } else {
      params.delete("search");
    }

    if (newStatus && newStatus !== "all") {
      params.set("status", newStatus);
    } else {
      params.delete("status");
    }

    if (newDate) {
      params.set("date", newDate);
    } else {
      params.delete("date");
    }

    params.set("page", "1"); // Reset to page 1 on filter change

    startTransition(() => {
      router.push(`/admin/appointments?${params.toString()}`);
    });
  }

  function handleReset() {
    setSearch("");
    setStatus("all");
    setDate("");
    startTransition(() => {
      router.push("/admin/appointments");
    });
  }

  const hasActiveFilters = Boolean(search || (status && status !== "all") || date);

  return (
    <div className="space-y-4 rounded-lg border border-border bg-surface p-4 shadow-card">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          applyFilters(search, status, date);
        }}
        className="grid items-end gap-4 sm:grid-cols-2 lg:grid-cols-4"
      >
        <div>
          <Input
            label="Search"
            placeholder="Name, phone, ref (AZR-...)"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <div>
          <Select
            label="Status"
            value={status}
            onChange={(e) => {
              const val = e.target.value;
              setStatus(val);
              applyFilters(search, val, date);
            }}
            options={[
              { value: "all", label: "All Statuses" },
              { value: "pending", label: "Pending" },
              { value: "confirmed", label: "Confirmed" },
              { value: "reschedule_requested", label: "Reschedule Requested" },
              { value: "declined", label: "Declined" },
              { value: "cancelled", label: "Cancelled" },
            ]}
          />
        </div>

        <div>
          <Input
            label="Consultation Date"
            type="date"
            value={date}
            onChange={(e) => {
              const val = e.target.value;
              setDate(val);
              applyFilters(search, status, val);
            }}
          />
        </div>

        <div className="flex items-center gap-2">
          <Button type="submit" variant="primary" loading={isPending} className="flex-1">
            Apply Filters
          </Button>
          {hasActiveFilters && (
            <Button type="button" variant="outline" onClick={handleReset} disabled={isPending}>
              Reset
            </Button>
          )}
        </div>
      </form>
    </div>
  );
}
