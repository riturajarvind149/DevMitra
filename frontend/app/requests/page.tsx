"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { accessRequestsAPI } from "@/lib/api";
import { useAuth } from "@/hooks/useAuth";
import { CheckCircle, XCircle, Clock } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import Link from "next/link";

export default function RequestsPage() {
  const { isAuthenticated } = useAuth();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<"sent" | "received">("sent");

  // Fetch sent requests
  const { data: sentRequests, isLoading: loadingSent } = useQuery({
    queryKey: ["sentRequests"],
    queryFn: async () => {
      const { data } = await accessRequestsAPI.getMine();
      console.log("Sent requests loaded:", data);
      return data;
    },
    enabled: isAuthenticated,
  });

  // Fetch received requests
  const { data: receivedRequests, isLoading: loadingReceived } = useQuery({
    queryKey: ["receivedRequests"],
    queryFn: async () => {
      const { data } = await accessRequestsAPI.getIncoming();
      console.log("Received requests loaded:", data);
      return data;
    },
    enabled: isAuthenticated,
  });

  // Approve mutation
  const approveMutation = useMutation({
    mutationFn: (id: string) => accessRequestsAPI.approve(id),
    onSuccess: () => {
      console.log("Request approved successfully");
      queryClient.invalidateQueries({ queryKey: ["receivedRequests"] });
      alert("Request approved successfully!");
    },
    onError: (error: any) => {
      console.error("Failed to approve request:", error);
      alert(error.response?.data?.message || "Failed to approve request");
    },
  });

  // Reject mutation
  const rejectMutation = useMutation({
    mutationFn: (id: string) => accessRequestsAPI.reject(id),
    onSuccess: () => {
      console.log("Request rejected successfully");
      queryClient.invalidateQueries({ queryKey: ["receivedRequests"] });
      alert("Request rejected");
    },
    onError: (error: any) => {
      console.error("Failed to reject request:", error);
      alert(error.response?.data?.message || "Failed to reject request");
    },
  });

  if (!isAuthenticated) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">
          Authentication Required
        </h1>
        <p className="text-gray-600">Please login to view requests</p>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "PENDING":
        return (
          <span className="flex items-center space-x-1 text-yellow-700 bg-yellow-100 px-3 py-1 rounded-full text-sm font-medium">
            <Clock className="h-4 w-4" />
            <span>Pending</span>
          </span>
        );
      case "APPROVED":
        return (
          <span className="flex items-center space-x-1 text-green-700 bg-green-100 px-3 py-1 rounded-full text-sm font-medium">
            <CheckCircle className="h-4 w-4" />
            <span>Approved</span>
          </span>
        );
      case "REJECTED":
        return (
          <span className="flex items-center space-x-1 text-red-700 bg-red-100 px-3 py-1 rounded-full text-sm font-medium">
            <XCircle className="h-4 w-4" />
            <span>Rejected</span>
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Access Requests</h1>

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-gray-200 mb-6">
        <div className="flex border-b border-gray-200">
          <button
            onClick={() => setActiveTab("sent")}
            className={`flex-1 px-6 py-4 font-medium transition ${
              activeTab === "sent"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Sent Requests ({sentRequests?.length || 0})
          </button>
          <button
            onClick={() => setActiveTab("received")}
            className={`flex-1 px-6 py-4 font-medium transition ${
              activeTab === "received"
                ? "text-indigo-600 border-b-2 border-indigo-600"
                : "text-gray-600 hover:text-gray-900"
            }`}
          >
            Received Requests ({receivedRequests?.length || 0})
          </button>
        </div>
      </div>

      {/* Sent Requests Tab */}
      {activeTab === "sent" && (
        <div className="space-y-4">
          {loadingSent ? (
            <div className="text-center py-12">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
            </div>
          ) : sentRequests && sentRequests.length > 0 ? (
            sentRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-lg border border-gray-200 p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <Link
                      href={`/projects/${request.projectId}`}
                      className="text-xl font-semibold text-indigo-600 hover:text-indigo-700"
                    >
                      {request.project?.title || "Unknown Project"}
                    </Link>
                    <p className="text-sm text-gray-600 mt-1">
                      Submitted{" "}
                      {formatDistanceToNow(new Date(request.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Reason:</p>
                    <p className="text-gray-600">{request.reason}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      How you can contribute:
                    </p>
                    <p className="text-gray-600">{request.suggestion}</p>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-600">No sent requests</p>
            </div>
          )}
        </div>
      )}

      {/* Received Requests Tab */}
      {activeTab === "received" && (
        <div className="space-y-4">
          {loadingReceived ? (
            <div className="text-center py-12">
              <div className="inline-block h-12 w-12 animate-spin rounded-full border-4 border-solid border-indigo-600 border-r-transparent"></div>
            </div>
          ) : receivedRequests && receivedRequests.length > 0 ? (
            receivedRequests.map((request) => (
              <div
                key={request.id}
                className="bg-white rounded-lg border border-gray-200 p-6"
              >
                <div className="flex justify-between items-start mb-4">
                  <div className="flex items-center space-x-3">
                    {request.requester?.avatarUrl && (
                      <img
                        src={request.requester.avatarUrl}
                        alt={request.requester.username}
                        className="h-12 w-12 rounded-full"
                      />
                    )}
                    <div>
                      <h3 className="text-xl font-semibold text-gray-900">
                        {request.requester?.username || "Unknown User"}
                      </h3>
                      <Link
                        href={`/projects/${request.projectId}`}
                        className="text-sm text-indigo-600 hover:text-indigo-700"
                      >
                        For: {request.project?.title}
                      </Link>
                      <p className="text-sm text-gray-600">
                        Submitted{" "}
                        {formatDistanceToNow(new Date(request.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                  </div>
                  {getStatusBadge(request.status)}
                </div>
                <div className="space-y-3 mb-4">
                  <div>
                    <p className="text-sm font-medium text-gray-700">Reason:</p>
                    <p className="text-gray-600">{request.reason}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      How they can contribute:
                    </p>
                    <p className="text-gray-600">{request.suggestion}</p>
                  </div>
                </div>
                {request.status === "PENDING" && (
                  <div className="flex space-x-3 pt-4 border-t border-gray-200">
                    <button
                      onClick={() => approveMutation.mutate(request.id)}
                      disabled={approveMutation.isPending}
                      className="flex-1 bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:bg-gray-400"
                    >
                      {approveMutation.isPending ? "Approving..." : "Approve"}
                    </button>
                    <button
                      onClick={() => rejectMutation.mutate(request.id)}
                      disabled={rejectMutation.isPending}
                      className="flex-1 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition disabled:bg-gray-400"
                    >
                      {rejectMutation.isPending ? "Rejecting..." : "Reject"}
                    </button>
                  </div>
                )}
              </div>
            ))
          ) : (
            <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
              <p className="text-gray-600">No received requests</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
