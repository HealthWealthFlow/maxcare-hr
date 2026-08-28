import React, { useState, useEffect, useId } from 'react';
import { useLeave } from '../../context/LeaveContext';
import { LeaveType } from '../../types/leave';

export const ApplyLeave: React.FC = () => {
  const { 
    currentUser, 
    policy, 
    calculateWorkingDays, 
    calculateNoticeDays, 
    applyLeave, 
    setCurrentTab 
  } = useLeave();

  const fileInputId = useId();
  const [selectedType, setSelectedType] = useState<LeaveType>('annual');
  const [startDate, setStartDate] = useState<string>('2026-08-28');
  const [endDate, setEndDate] = useState<string>('2026-08-29');
  const [reason, setReason] = useState<string>('');
  const [docFile, setDocFile] = useState<File | null>(null);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [showSuccessModal, setShowSuccessModal] = useState<boolean>(false);
  // Manual duration (prefilled from date range, but editable by the user).
  const [durationDays, setDurationDays] = useState<number>(() => calculateWorkingDays(startDate, endDate));

  // Dynamic calculations
  const workingDays = calculateWorkingDays(startDate, endDate);
  const noticeDays = calculateNoticeDays(startDate);

  // Keep the manual duration in sync with the selected date range.
  useEffect(() => {
    setDurationDays(workingDays);
  }, [startDate, endDate]);

  const requiredNotice = selectedType === 'annual' 
    ? policy.annualNoticeDays 
    : selectedType === 'unpaid' 
    ? policy.unpaidNoticeDays 
    : policy.emergencyNoticeDays;

  const isLate = selectedType !== 'emergency' && noticeDays < requiredNotice && noticeDays >= 0;

  const availableBefore = Math.max(0, currentUser.entitlements.annualTotal - currentUser.entitlements.annualUsed - currentUser.entitlements.annualPending);
  const deduction = selectedType === 'annual' || (selectedType === 'emergency' && policy.emergencyTreatment === 'deduct_annual')
    ? durationDays
    : 0;
  const balanceAfter = Math.max(0, availableBefore - deduction);

  const handleStartDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newStart = e.target.value;
    setStartDate(newStart);
    if (new Date(endDate) < new Date(newStart)) {
      setEndDate(newStart);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!startDate || !endDate) return;

    setIsSubmitting(true);
    setTimeout(() => {
      applyLeave({
        type: selectedType,
        startDate,
        endDate,
        durationDays: durationDays,
        reason: reason || (selectedType === 'annual' ? 'Annual leave' : selectedType === 'emergency' ? 'Family emergency' : selectedType === 'sick' ? 'Medical leave' : 'Personal matter'),
        supportingDocName: docFile ? docFile.name : undefined,
        isLate,
        requiredNoticeDays: requiredNotice,
        actualNoticeDays: noticeDays
      });
      setIsSubmitting(false);
      setShowSuccessModal(true);
    }, 600);
  };

  return (
    <div className="flex flex-col w-full max-w-4xl mx-auto space-y-8 pb-12">
      {/* Blue Banner */}
      <div className="relative w-full rounded-3xl overflow-hidden p-6 md:p-8 shadow-md flex flex-col md:flex-row gap-6 items-center justify-between bg-[#004ac6] text-white">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400/10 via-white/5 to-transparent pointer-events-none"></div>
        <div className="absolute -top-32 -left-32 w-96 h-96 bg-white/10 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-blue-300/20 rounded-full blur-3xl pointer-events-none"></div>

        <div className="relative z-10 flex-1 space-y-1.5">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">New Application</h1>
          <p className="text-base text-blue-100 font-normal">
            Submit your leave request for approval.
          </p>
        </div>

        {/* Small Balance Card in Banner */}
        <div className="relative z-10 bg-white text-[#191b23] rounded-2xl p-5 shadow-sm min-w-[240px]">
          <div className="text-[11px] font-bold text-[#434655] uppercase tracking-wider mb-2">
            Annual Leave Balance
          </div>
          <div className="flex justify-between items-end mb-2">
            <div className="text-2xl font-bold text-[#191b23]">
              {availableBefore} <span className="text-xs font-normal text-[#434655]">Days Available</span>
            </div>
          </div>
          <div className="h-2 w-full bg-[#e7e7f3] rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-[#004ac6] rounded-full"
              style={{ width: `${Math.min(100, Math.round((currentUser.entitlements.annualUsed / (currentUser.entitlements.annualTotal || 1)) * 100))}%` }}
            ></div>
          </div>
          <div className="flex justify-between text-xs text-[#434655]">
            <span>Used: {currentUser.entitlements.annualUsed}</span>
            <span>Total: {currentUser.entitlements.annualTotal}</span>
          </div>
        </div>
      </div>

      {/* Main Form & Projection Grid */}
      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Step 1: Select Leave Type */}
        <section className="space-y-4">
          <h2 className="text-lg font-bold text-[#191b23] flex items-center gap-3">
            <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#2563eb] text-white text-xs font-bold">
              1
            </span>
            Select Leave Type
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Annual Leave */}
            <div
              onClick={() => setSelectedType('annual')}
              className={`cursor-pointer rounded-2xl p-6 transition-all duration-200 relative border ${
                selectedType === 'annual'
                  ? 'bg-[#2563eb] text-white border-[#2563eb] shadow-md'
                  : 'bg-[#ededf9] text-[#191b23] border-transparent hover:border-[#c3c6d7] hover:shadow-2xs'
              }`}
            >
              <span className={`material-symbols-outlined text-4xl mb-4 block ${selectedType === 'annual' ? 'text-white' : 'text-[#004ac6]'}`}>
                flight_takeoff
              </span>
              <div className="font-bold text-lg mb-1">Annual Leave</div>
              <div className={`text-xs ${selectedType === 'annual' ? 'text-blue-100' : 'text-[#434655]'}`}>
                Paid time off from work.
              </div>
              {selectedType === 'annual' && (
                <div className="absolute top-4 right-4 text-white">
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                </div>
              )}
            </div>

            {/* Medical Leave (sick / MC) */}
            <div
              onClick={() => setSelectedType('sick')}
              className={`cursor-pointer rounded-2xl p-6 transition-all duration-200 relative border ${
                selectedType === 'sick'
                  ? 'bg-[#006e2d] text-white border-[#006e2d] shadow-md'
                  : 'bg-[#ededf9] text-[#191b23] border-transparent hover:border-[#c3c6d7] hover:shadow-2xs'
              }`}
            >
              <span className={`material-symbols-outlined text-4xl mb-4 block ${selectedType === 'sick' ? 'text-white' : 'text-[#006e2d]'}`}>
                medical_services
              </span>
              <div className="font-bold text-lg mb-1">Medical Leave</div>
              <div className={`text-xs ${selectedType === 'sick' ? 'text-green-100' : 'text-[#434655]'}`}>
                Medical / MC (sick) absence.
              </div>
              {selectedType === 'sick' && (
                <div className="absolute top-4 right-4 text-white">
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                </div>
              )}
            </div>

            {/* Unpaid Leave */}
            <div
              onClick={() => setSelectedType('unpaid')}
              className={`cursor-pointer rounded-2xl p-6 transition-all duration-200 relative border ${
                selectedType === 'unpaid'
                  ? 'bg-[#2563eb] text-white border-[#2563eb] shadow-md'
                  : 'bg-[#ededf9] text-[#191b23] border-transparent hover:border-[#c3c6d7] hover:shadow-2xs'
              }`}
            >
              <span className={`material-symbols-outlined text-4xl mb-4 block ${selectedType === 'unpaid' ? 'text-white' : 'text-[#434655]'}`}>
                money_off
              </span>
              <div className="font-bold text-lg mb-1">Unpaid Leave</div>
              <div className={`text-xs ${selectedType === 'unpaid' ? 'text-blue-100' : 'text-[#434655]'}`}>
                Approved absence without pay.
              </div>
              {selectedType === 'unpaid' && (
                <div className="absolute top-4 right-4 text-white">
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                </div>
              )}
            </div>

            {/* Emergency Leave */}
            <div
              onClick={() => setSelectedType('emergency')}
              className={`cursor-pointer rounded-2xl p-6 transition-all duration-200 relative border ${
                selectedType === 'emergency'
                  ? 'bg-[#c04400] text-white border-[#c04400] shadow-md'
                  : 'bg-[#ededf9] text-[#191b23] border-transparent hover:border-[#c3c6d7] hover:shadow-2xs'
              }`}
            >
              <span className={`material-symbols-outlined text-4xl mb-4 block ${selectedType === 'emergency' ? 'text-white' : 'text-[#ba1a1a]'}`}>
                medical_services
              </span>
              <div className="font-bold text-lg mb-1">Emergency Leave</div>
              <div className={`text-xs ${selectedType === 'emergency' ? 'text-orange-100' : 'text-[#434655]'}`}>
                Unforeseen circumstances.
              </div>
              {selectedType === 'emergency' && (
                <div className="absolute top-4 right-4 text-white">
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Two-Column Area for Step 2/3 & Sticky Projection */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            {/* Step 2: Date & Duration */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-[#191b23] flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#2563eb] text-white text-xs font-bold">
                  2
                </span>
                Date & Duration
              </h2>

              <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#e1e2ed] space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Start Date */}
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-[#434655] uppercase tracking-wider mb-2">
                      Start Date
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#737686] pointer-events-none text-[20px]">
                        calendar_today
                      </span>
                      <input
                        type="date"
                        value={startDate}
                        onChange={handleStartDateChange}
                        required
                        className="w-full bg-[#faf8ff] rounded-xl pl-11 pr-4 py-3 text-sm text-[#191b23] border border-[#c3c6d7] focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6] font-medium"
                      />
                    </div>
                  </div>

                  {/* End Date */}
                  <div className="flex flex-col">
                    <label className="text-xs font-bold text-[#434655] uppercase tracking-wider mb-2">
                      End Date
                    </label>
                    <div className="relative">
                      <span className="absolute left-3.5 top-1/2 -translate-y-1/2 material-symbols-outlined text-[#737686] pointer-events-none text-[20px]">
                        event
                      </span>
                      <input
                        type="date"
                        value={endDate}
                        min={startDate}
                        onChange={(e) => setEndDate(e.target.value)}
                        required
                        className="w-full bg-[#faf8ff] rounded-xl pl-11 pr-4 py-3 text-sm text-[#191b23] border border-[#c3c6d7] focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6] font-medium"
                      />
                    </div>
                  </div>
                </div>

                {/* Duration (manual) */}
                <div className="flex items-center justify-between p-4 bg-[#dbe1ff]/40 rounded-xl border border-[#b4c5ff]/50">
                  <div className="flex items-center gap-2.5">
                    <span className="material-symbols-outlined text-[#004ac6]">hourglass_empty</span>
                    <label htmlFor="duration" className="text-sm font-medium text-[#191b23]">Duration (Days)</label>
                  </div>
                  <input
                    id="duration"
                    type="number"
                    min={1}
                    value={durationDays}
                    onChange={(e) => setDurationDays(Math.max(0, parseInt(e.target.value, 10) || 0))}
                    className="w-24 bg-white rounded-lg text-center text-base md:text-lg font-bold text-[#004ac6] border border-[#c3c6d7] focus:outline-none focus:border-[#004ac6] py-1.5"
                  />
                </div>

                <p className="text-xs text-[#434655] flex items-start gap-1.5 pt-1">
                  <span className="material-symbols-outlined text-[16px] text-[#737686] shrink-0 mt-0.5">
                    info
                  </span>
                  <span>You can adjust the number of leave days manually.</span>
                </p>
              </div>
            </section>

            {/* Step 3: Details */}
            <section className="space-y-4">
              <h2 className="text-lg font-bold text-[#191b23] flex items-center gap-3">
                <span className="flex items-center justify-center w-7 h-7 rounded-full bg-[#2563eb] text-white text-xs font-bold">
                  3
                </span>
                Details
              </h2>

              <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#e1e2ed] space-y-5">
                <div className="flex flex-col">
                  <label className="text-xs font-bold text-[#434655] uppercase tracking-wider mb-2">
                    Reason for Leave
                  </label>
                  <textarea
                    rows={4}
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Briefly describe the reason for your leave..."
                    className="w-full bg-[#faf8ff] rounded-xl p-4 text-sm text-[#191b23] border border-[#c3c6d7] focus:outline-none focus:border-[#004ac6] focus:ring-1 focus:ring-[#004ac6] resize-y placeholder:text-[#737686]/60"
                  />
                </div>

                <div className="flex flex-col">
                  <label className="text-xs font-bold text-[#434655] uppercase tracking-wider mb-2">
                    {selectedType === 'sick' || selectedType === 'emergency' ? 'Supporting Document (Compulsory)' : 'Supporting Document (Optional)'}
                  </label>
                  <label htmlFor={fileInputId} className="border-2 border-dashed border-[#c3c6d7] hover:border-[#2563eb] rounded-2xl p-6 flex flex-col items-center justify-center gap-2 hover:bg-[#faf8ff] transition-all cursor-pointer group">
                    <span className="material-symbols-outlined text-4xl text-[#737686] group-hover:text-[#2563eb] transition-colors">
                      photo_camera
                    </span>
                    <div className="text-sm text-[#191b23] text-center">
                      <span className="font-semibold text-[#004ac6]">Take a photo, choose from gallery, or upload</span><br />
                      <span className="text-xs text-[#434655]">
                        {docFile ? `Selected: ${docFile.name}` : 'Photo (JPG/PNG) or PDF (max. 10MB)'}
                      </span>
                    </div>
                    <input
                      id={fileInputId}
                      type="file"
                      accept="image/*,application/pdf"
                      className="hidden"
                      onChange={(e) => {
                        if (e.target.files && e.target.files[0]) {
                          setDocFile(e.target.files[0]);
                        }
                      }}
                    />
                  </label>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Balance Projection & Late Application Warning */}
          <div className="lg:col-span-1">
            <div className="sticky top-24 space-y-4">
              {/* Balance Projection Card */}
              <div className="bg-white rounded-3xl p-6 shadow-xs border border-[#e1e2ed] flex flex-col gap-4">
                <h3 className="text-base font-bold text-[#191b23] flex items-center gap-2">
                  <span className="material-symbols-outlined text-[#004ac6] text-[20px]">
                    calculate
                  </span>
                  Balance Projection
                </h3>

                <div className="space-y-2.5 text-sm">
                  <div className="flex justify-between items-center">
                    <span className="text-[#434655]">Available</span>
                    <span className="font-bold text-[#191b23]">{availableBefore} Days</span>
                  </div>
                  {deduction > 0 ? (
                    <>
                      <div className="flex justify-between items-center text-[#ba1a1a]">
                        <span>This Application</span>
                        <span className="font-bold">-{deduction} Days</span>
                      </div>
                      <div className="h-px bg-[#e1e2ed] w-full my-2"></div>
                      <div className="flex justify-between items-center">
                        <span className="font-bold text-[#191b23]">After Approval</span>
                        <span className={`text-xl font-bold ${availableBefore - deduction >= 0 ? 'text-[#006e2d]' : 'text-[#ba1a1a]'}`}>
                          {balanceAfter} Days
                        </span>
                      </div>
                    </>
                  ) : (
                    <div className="flex items-center gap-1.5 text-xs text-[#737686] pt-1">
                      <span className="material-symbols-outlined text-[16px]">info</span>
                      <span>This leave type does not affect your Annual Leave balance.</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Late Notice Warning Card */}
              {isLate && (
                <div className="bg-[#c04400] text-white rounded-3xl p-6 shadow-md animate-fadeIn">
                  <div className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-3xl shrink-0 text-orange-200">
                      warning
                    </span>
                    <div>
                      <h4 className="font-bold text-base mb-1">Late Application</h4>
                      <p className="text-xs leading-relaxed text-orange-100">
                        Required notice is <span className="font-bold">{requiredNotice} days</span>, but actual notice is{' '}
                        <span className="font-bold">{noticeDays} days</span>. Management approval will be strictly required.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-[#004ac6] hover:bg-[#003ea8] text-white rounded-2xl py-4 px-6 font-bold text-base shadow-sm hover:shadow-md transition-all active:scale-[0.98] min-h-[56px] flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span className="material-symbols-outlined animate-spin text-[20px]">
                    progress_activity
                  </span>
                ) : (
                  <>
                    <span>Submit Application</span>
                    <span className="material-symbols-outlined text-[20px]">send</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </form>

      {/* Success Modal */}
      {showSuccessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => {
              setShowSuccessModal(false);
              setCurrentTab('home');
            }}
          ></div>
          <div className="relative bg-white rounded-3xl p-8 shadow-2xl max-w-sm w-full mx-auto flex flex-col items-center text-center z-10 animate-scaleUp">
            <div className="w-20 h-20 bg-[#7cf994]/40 text-[#006e2d] rounded-full flex items-center justify-center mb-6">
              <span className="material-symbols-outlined text-4xl">check_circle</span>
            </div>
            <h3 className="text-2xl font-bold text-[#191b23] mb-2">
              Application Submitted
            </h3>
            <p className="text-sm text-[#434655] mb-6">
              Your leave request has been sent to your manager for review.
            </p>
            <div className="bg-[#f3f3fe] px-4 py-2 rounded-xl inline-flex items-center gap-2 text-xs font-bold mb-6">
              <span className="w-2.5 h-2.5 rounded-full bg-[#c04400]"></span>
              <span className="text-[#191b23] uppercase tracking-wider">Status: Pending Review</span>
            </div>
            <button
              onClick={() => {
                setShowSuccessModal(false);
                setCurrentTab('home');
              }}
              className="w-full bg-[#ededf9] hover:bg-[#e7e7f3] text-[#191b23] rounded-xl py-3 px-6 font-semibold text-sm transition-colors"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
