import React, { useState } from 'react';
import { useLeave } from '../../context/LeaveContext';

export const LeaveReview: React.FC = () => {
  const { 
    leaveRequests, 
    selectedRequestIdForReview, 
    setSelectedRequestIdForReview,
    approveRequest, 
    rejectRequest, 
    employees,
    setCurrentTab 
  } = useLeave();

  const [rejectionReasonInput, setRejectionReasonInput] = useState<string>('');
  const [showRejectModal, setShowRejectModal] = useState<boolean>(false);
  const [showApprovedToast, setShowApprovedToast] = useState<boolean>(false);

  const request = leaveRequests.find(r => r.id === selectedRequestIdForReview) || leaveRequests[0];
  const employee = employees.find(e => e.id === request?.employeeId) || employees[0];

  if (!request) {
    return (
      <div className="bg-white rounded-3xl p-12 text-center border border-[#e1e2ed] max-w-xl mx-auto">
        <h3 className="text-xl font-bold text-[#191b23]">No Request Selected</h3>
        <p className="text-sm text-[#434655] mt-2 mb-6">Select a request from the list to review.</p>
        <button
          onClick={() => setCurrentTab('manager-dashboard')}
          className="bg-[#2563eb] text-white px-6 py-2.5 rounded-xl font-bold text-sm"
        >
          Go to Dashboard
        </button>
      </div>
    );
  }

  const handleApprove = () => {
    approveRequest(request.id);
    setShowApprovedToast(true);
    setTimeout(() => {
      setShowApprovedToast(false);
    }, 3000);
  };

  const handleConfirmReject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!rejectionReasonInput.trim()) return;
    rejectRequest(request.id, rejectionReasonInput);
    setShowRejectModal(false);
    setRejectionReasonInput('');
  };

  const availableBal = Math.max(0, employee.entitlements.annualTotal - employee.entitlements.annualUsed - employee.entitlements.annualPending);

  return (
    <div className="flex flex-col w-full max-w-5xl mx-auto space-y-6">
      {/* Top Breadcrumb & Selector */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setCurrentTab('manager-dashboard')}
            className="p-2 rounded-xl bg-white border border-[#c3c6d7] text-[#434655] hover:bg-[#ededf9] transition-colors"
          >
            <span className="material-symbols-outlined text-[20px]">arrow_back</span>
          </button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl md:text-3xl font-bold text-[#191b23]">
                Leave Request Review
              </h1>
              <span className="bg-[#ededf9] text-[#004ac6] font-bold text-xs px-3 py-1 rounded-full">
                {request.id}
              </span>
            </div>
            <p className="text-xs text-[#737686] mt-0.5">
              Review details, notice compliance, and approve or reject this request.
            </p>
          </div>
        </div>

        {/* Quick Request Switcher */}
        <div className="flex items-center gap-2 bg-white px-3 py-1.5 rounded-2xl border border-[#c3c6d7]">
          <span className="text-xs font-bold text-[#434655]">Select Request:</span>
          <select
            value={request.id}
            onChange={(e) => setSelectedRequestIdForReview(e.target.value)}
            className="bg-transparent text-xs font-bold text-[#004ac6] focus:outline-none cursor-pointer"
          >
            {leaveRequests.map(r => (
              <option key={r.id} value={r.id}>
                {r.id} - {r.employeeName} ({r.type.toUpperCase()})
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Main Review Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left 8 Cols: Detailed Form & Information */}
        <div className="lg:col-span-8 space-y-6">
          {/* Employee Info Header */}
          <div className="bg-white rounded-3xl p-6 border border-[#e1e2ed] shadow-xs flex flex-col sm:flex-row items-center sm:items-start justify-between gap-4">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <img
                src={employee.avatar}
                alt={employee.name}
                className="w-16 h-16 rounded-full object-cover shadow-sm border-2 border-white"
              />
              <div>
                <div className="flex items-center gap-2 justify-center sm:justify-start">
                  <h2 className="text-xl font-bold text-[#191b23]">{employee.name}</h2>
                  <span className="bg-[#f3f3fe] text-[#434655] font-semibold text-xs px-2 py-0.5 rounded">
                    {employee.empCode}
                  </span>
                </div>
                <p className="text-sm text-[#434655] font-medium">{employee.role}</p>
                <p className="text-xs text-[#737686]">{employee.department}</p>
              </div>
            </div>

            <div className="text-right">
              <span className={`text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider ${
                request.status === 'approved'
                  ? 'bg-[#7cf994]/40 text-[#006e2d]'
                  : request.status === 'rejected'
                  ? 'bg-[#ffdad6] text-[#ba1a1a]'
                  : 'bg-[#ffdbce] text-[#973400]'
              }`}>
                {request.status.toUpperCase()}
              </span>
            </div>
          </div>

          {/* Request Specs Grid */}
          <div className="bg-white rounded-3xl p-6 md:p-8 border border-[#e1e2ed] shadow-xs space-y-6">
            <h3 className="text-base font-bold text-[#191b23] border-b border-[#e1e2ed] pb-3">
              Application Details
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-sm">
              <div>
                <span className="block text-xs font-bold text-[#737686] uppercase mb-1">
                  Leave Type
                </span>
                <div className="flex items-center gap-2 font-bold text-[#004ac6] text-base capitalize">
                  <span className="material-symbols-outlined text-[20px]">
                    {request.type === 'annual' ? 'flight_takeoff' : request.type === 'sick' || request.type === 'emergency' ? 'medical_services' : 'money_off'}
                  </span>
                  {request.type === 'annual' ? 'Annual Leave' : request.type === 'sick' ? 'Medical Leave' : request.type === 'emergency' ? 'Emergency Leave' : 'Unpaid Leave'}
                </div>
              </div>

              <div>
                <span className="block text-xs font-bold text-[#737686] uppercase mb-1">
                  Duration & Dates
                </span>
                <div className="font-bold text-[#191b23] text-base">
                  {request.startDate === request.endDate
                    ? `${request.startDate} (1 Day)`
                    : `${request.startDate} to ${request.endDate} (${request.durationDays} Working Days)`}
                </div>
              </div>

              <div>
                <span className="block text-xs font-bold text-[#737686] uppercase mb-1">
                  Submitted On
                </span>
                <div className="font-semibold text-[#191b23]">
                  {request.submittedDate}
                </div>
              </div>

              <div>
                <span className="block text-xs font-bold text-[#737686] uppercase mb-1">
                  Advance Notice Given
                </span>
                <div className={`font-bold flex items-center gap-1.5 ${request.isLate ? 'text-[#ba1a1a]' : 'text-[#006e2d]'}`}>
                  <span className="material-symbols-outlined text-[18px]">
                    {request.isLate ? 'warning' : 'check_circle'}
                  </span>
                  {request.actualNoticeDays} Days Notice (Required: {request.requiredNoticeDays} Days)
                </div>
              </div>
            </div>

            {/* Late Application Alert Callout */}
            {request.isLate && (
              <div className="bg-[#ffdad6]/50 border border-[#ba1a1a]/40 p-4 rounded-2xl flex items-start gap-3">
                <span className="material-symbols-outlined text-[#ba1a1a] text-2xl shrink-0 mt-0.5">
                  error
                </span>
                <div className="text-xs text-[#ba1a1a] leading-relaxed">
                  <span className="font-bold block text-sm mb-0.5">Late Notice Exception</span>
                  This request does not meet the standard {request.requiredNoticeDays}-day advance notice policy requirement. Advance notice submitted is only {request.actualNoticeDays} days. Manager discretion applies.
                </div>
              </div>
            )}

            {/* Reason Box */}
            <div>
              <span className="block text-xs font-bold text-[#737686] uppercase mb-2">
                Reason for Leave
              </span>
              <div className="bg-[#faf8ff] p-4 rounded-2xl border border-[#e1e2ed] text-sm text-[#191b23] leading-relaxed">
                {request.reason || 'No specific reason provided.'}
              </div>
            </div>

            {/* If Rejected already, show rejection reason */}
            {request.status === 'rejected' && request.rejectionReason && (
              <div className="bg-[#ffdad6]/40 border border-[#ba1a1a]/40 p-4 rounded-2xl text-xs text-[#ba1a1a]">
                <span className="font-bold block mb-1">Rejection Reason Provided:</span>
                {request.rejectionReason}
              </div>
            )}

            {/* Action Bar */}
            <div className="flex flex-col sm:flex-row items-center justify-end gap-3 pt-4 border-t border-[#e1e2ed]">
              {request.status === 'pending' ? (
                <>
                  <button
                    onClick={() => setShowRejectModal(true)}
                    className="w-full sm:w-auto bg-[#fee2e2] hover:bg-[#fecaca] text-[#ba1a1a] font-bold text-sm px-6 py-3 rounded-2xl transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">close</span>
                    Reject Request
                  </button>

                  <button
                    onClick={handleApprove}
                    className="w-full sm:w-auto bg-[#006e2d] hover:bg-[#005a24] text-white font-bold text-sm px-8 py-3 rounded-2xl shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[18px]">check</span>
                    Approve Request
                  </button>
                </>
              ) : request.status === 'approved' ? (
                <div className="flex items-center gap-2 text-[#006e2d] font-bold text-sm bg-[#dcfce7] px-5 py-2.5 rounded-2xl">
                  <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  This request has been Approved
                </div>
              ) : (
                <div className="flex items-center gap-2 text-[#ba1a1a] font-bold text-sm bg-[#fee2e2] px-5 py-2.5 rounded-2xl">
                  <span className="material-symbols-outlined text-[20px]">cancel</span>
                  This request was Rejected
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right 4 Cols: Balances & Activity */}
        <div className="lg:col-span-4 space-y-6">
          {/* Employee Annual Leave Balance Card */}
          <div className="bg-[#f3f3fe] rounded-3xl p-6 border border-[#e1e2ed] shadow-xs space-y-4">
            <div className="flex justify-between items-start">
              <h4 className="text-sm font-bold text-[#191b23]">
                Annual Leave Balance
              </h4>
              <span className="bg-[#2563eb] text-white font-bold text-xs px-3 py-1 rounded-full">
                {availableBal} Days Available
              </span>
            </div>

            <div className="space-y-2.5 text-xs text-[#434655]">
              <div className="flex justify-between">
                <span>Total Entitlement:</span>
                <span className="font-bold text-[#191b23]">{employee.entitlements.annualTotal} Days</span>
              </div>
              <div className="flex justify-between">
                <span>Used to Date:</span>
                <span className="font-bold text-[#191b23]">{employee.entitlements.annualUsed} Days</span>
              </div>
              <div className="flex justify-between">
                <span>Pending Approvals:</span>
                <span className="font-bold text-[#973400]">{employee.entitlements.annualPending} Days</span>
              </div>
              <div className="h-px bg-[#e1e2ed] my-2"></div>
              <div className="flex justify-between text-sm">
                <span className="font-bold text-[#191b23]">Balance if Approved:</span>
                <span className="font-bold text-[#006e2d]">
                  {Math.max(0, employee.entitlements.annualTotal - employee.entitlements.annualUsed - (request.status === 'pending' ? request.durationDays : 0))} Days
                </span>
              </div>
            </div>
          </div>

          {/* Activity Log */}
          <div className="bg-white rounded-3xl p-6 border border-[#e1e2ed] shadow-xs space-y-4">
            <h4 className="text-xs font-bold text-[#434655] uppercase tracking-wider">
              Request Activity
            </h4>

            <div className="space-y-4 text-xs">
              <div className="flex items-start gap-3">
                <span className="w-2 h-2 rounded-full bg-[#004ac6] mt-1.5 shrink-0"></span>
                <div>
                  <div className="font-bold text-[#191b23]">Request Submitted</div>
                  <div className="text-[#737686]">{request.submittedDate} • by {request.employeeName}</div>
                </div>
              </div>

              {request.isLate && (
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-[#ba1a1a] mt-1.5 shrink-0"></span>
                  <div>
                    <div className="font-bold text-[#ba1a1a]">Late Notice Flag</div>
                    <div className="text-[#737686]">Detected by automated policy rules engine</div>
                  </div>
                </div>
              )}

              {request.status === 'approved' && (
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-[#006e2d] mt-1.5 shrink-0"></span>
                  <div>
                    <div className="font-bold text-[#006e2d]">Approved by Manager</div>
                    <div className="text-[#737686]">Balances automatically updated</div>
                  </div>
                </div>
              )}

              {request.status === 'rejected' && (
                <div className="flex items-start gap-3">
                  <span className="w-2 h-2 rounded-full bg-[#ba1a1a] mt-1.5 shrink-0"></span>
                  <div>
                    <div className="font-bold text-[#ba1a1a]">Rejected by Manager</div>
                    <div className="text-[#737686]">Pending hold released back to employee</div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-xs" onClick={() => setShowRejectModal(false)}></div>
          <div className="relative bg-white rounded-3xl p-6 md:p-8 max-w-md w-full shadow-2xl z-10 space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#ffdad6] text-[#ba1a1a] flex items-center justify-center">
                <span className="material-symbols-outlined text-[22px]">warning</span>
              </div>
              <div>
                <h3 className="text-lg font-bold text-[#191b23]">Reject Leave Request</h3>
                <p className="text-xs text-[#737686]">Please specify a reason for {request.employeeName}.</p>
              </div>
            </div>

            <form onSubmit={handleConfirmReject} className="space-y-4">
              <textarea
                required
                rows={3}
                value={rejectionReasonInput}
                onChange={(e) => setRejectionReasonInput(e.target.value)}
                placeholder="e.g. Insufficient team coverage during project launch week..."
                className="w-full bg-[#faf8ff] rounded-xl p-3 text-xs text-[#191b23] border border-[#c3c6d7] focus:outline-none focus:border-[#ba1a1a]"
              />

              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowRejectModal(false)}
                  className="px-4 py-2 text-xs font-bold text-[#434655] hover:bg-[#ededf9] rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold bg-[#ba1a1a] hover:bg-[#990000] text-white rounded-xl shadow-xs"
                >
                  Confirm Rejection
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Approved Toast */}
      {showApprovedToast && (
        <div className="fixed bottom-6 right-6 z-50 bg-[#006e2d] text-white px-6 py-3 rounded-2xl shadow-xl flex items-center gap-2 animate-slideUp">
          <span className="material-symbols-outlined text-[20px]">check_circle</span>
          <span className="text-sm font-bold">Leave request approved successfully!</span>
        </div>
      )}
    </div>
  );
};
