import { gql } from "@apollo/client";

// ─── Auth ─────────────────────────────────────────────────────────────────────

export const GOOGLE_LOGIN = gql`
  mutation GoogleLogin($input: GoogleLoginInput!) {
    googleLogin(input: $input) {
      accessToken
      refreshToken
      user { id name email avatarUrl phone verified }
    }
  }
`;

// ─── OTP ─────────────────────────────────────────────────────────────────────

export const SEND_PHONE_OTP = gql`
  mutation SendPhoneOtp($input: SendPhoneOtpInput!) {
    sendPhoneOtp(input: $input) {
      success
      message
    }
  }
`;

export const VERIFY_PHONE_OTP = gql`
  mutation VerifyPhoneOtp($input: VerifyPhoneOtpInput!) {
    verifyPhoneOtp(input: $input) {
      success
      message
    }
  }
`;

export const REQUEST_PIN_CHANGE_OTP = gql`
  mutation RequestPinChangeOtp {
    requestPinChangeOtp {
      success
      message
    }
  }
`;

export const VERIFY_PIN_CHANGE_OTP = gql`
  mutation VerifyPinChangeOtp($input: VerifyPinChangeOtpInput!) {
    verifyPinChangeOtp(input: $input) {
      success
      message
      pinChangeToken
    }
  }
`;

export const CHANGE_PIN_WITH_OTP = gql`
  mutation ChangePinWithOtp($input: ChangePinInput!) {
    changePinWithOtp(input: $input) {
      success
      message
    }
  }
`;

// ─── User ─────────────────────────────────────────────────────────────────────

export const CREATE_USER = gql`
  mutation CreateUser($input: CreateUserInput!) {
    createUser(input: $input) {
      id name email location verified createdAt
    }
  }
`;

export const ADMIN_UPDATE_USER = gql`
  mutation AdminUpdateUser($id: String!, $input: AdminUpdateUserInput!) {
    adminUpdateUser(id: $id, input: $input) {
      id name email location verified rolId permission
    }
  }
`;

export const DELETE_USER = gql`
  mutation DeleteUser($id: String!) {
    deleteUser(id: $id) { id }
  }
`;

export const UPDATE_USER = gql`
  mutation UpdateUser($input: UpdateUserInput!) {
    updateUser(input: $input) {
      id name email phone avatarUrl coverUrl bio location
      language notifMessages notifOffers notifMarketing
      showEmail showPhone themePreference
      verified updatedAt
    }
  }
`;

// ─── Roles ────────────────────────────────────────────────────────────────────

export const CREATE_ROL = gql`
  mutation CreateRol($input: CreateRolInput!) {
    createRol(input: $input) {
      id label description createdAt actions
      createdBy { id name }
    }
  }
`;

export const UPDATE_ROL = gql`
  mutation UpdateRol($id: String!, $input: UpdateRolInput!) {
    updateRol(id: $id, input: $input) {
      id label description actions
    }
  }
`;

export const DELETE_ROL = gql`
  mutation DeleteRol($id: String!) {
    deleteRol(id: $id) { id }
  }
`;

// ─── Products ─────────────────────────────────────────────────────────────────

export const CREATE_PRODUCT = gql`
  mutation CreateProduct($input: CreateProductInput!) {
    createProduct(input: $input) {
      id title price status createdAt
      images { id url sortOrder }
    }
  }
`;

export const UPDATE_PRODUCT = gql`
  mutation UpdateProduct($id: String!, $input: UpdateProductInput!) {
    updateProduct(id: $id, input: $input) {
      id title description price discount condition city status
      images { id url sortOrder }
    }
  }
`;

export const DELETE_PRODUCT = gql`
  mutation DeleteProduct($id: String!) {
    deleteProduct(id: $id) { id }
  }
`;

export const VIEW_PRODUCT = gql`
  mutation ViewProduct($id: String!, $viewerKey: String) {
    viewProduct(id: $id, viewerKey: $viewerKey) { id views }
  }
`;

export const BUMP_PRODUCT = gql`
  mutation BumpProduct($id: String!) {
    bumpProduct(id: $id) { id bumpedAt }
  }
`;

export const BOOST_PRODUCT = gql`
  mutation BoostProduct($id: String!, $days: Int) {
    boostProduct(id: $id, days: $days) { id boostedUntil }
  }
`;

export const ADMIN_SET_PRODUCT_STATUS = gql`
  mutation AdminSetProductStatus($id: String!, $status: String!, $reason: String) {
    adminSetProductStatus(id: $id, status: $status, reason: $reason) { id status }
  }
`;

export const UNBOOST_PRODUCT = gql`
  mutation UnboostProduct($id: String!) {
    unboostProduct(id: $id) { id boostedUntil }
  }
`;

export const ADMIN_UPDATE_PRODUCT = gql`
  mutation AdminUpdateProduct($id: String!, $input: UpdateProductInput!) {
    adminUpdateProduct(id: $id, input: $input) {
      id title description price discount condition city status
      category { id label }
    }
  }
`;

export const ADMIN_DELETE_PRODUCT_IMAGE = gql`
  mutation AdminDeleteProductImage($imageId: String!) {
    adminDeleteProductImage(imageId: $imageId) {
      id
      images { id url sortOrder }
    }
  }
`;

export const SUSPEND_USER = gql`
  mutation SuspendUser($id: String!, $reason: String) {
    suspendUser(id: $id, reason: $reason) { id suspended suspendedReason permission }
  }
`;

export const UNSUSPEND_USER = gql`
  mutation UnsuspendUser($id: String!) {
    unsuspendUser(id: $id) { id suspended suspendedReason permission }
  }
`;

export const DELETE_PAYMENT = gql`
  mutation DeletePayment($id: String!) {
    deletePayment(id: $id) { id }
  }
`;

// ─── Favorites ────────────────────────────────────────────────────────────────

export const TOGGLE_FAVORITE = gql`
  mutation ToggleFavorite($productId: String!) {
    toggleFavorite(productId: $productId) { added }
  }
`;

// ─── Reviews ──────────────────────────────────────────────────────────────────

export const CREATE_REVIEW = gql`
  mutation CreateReview($input: CreateReviewInput!) {
    createReview(input: $input) {
      id rating text createdAt
      author { id name avatarUrl }
    }
  }
`;

export const DELETE_REVIEW = gql`
  mutation DeleteReview($id: String!) {
    deleteReview(id: $id) { id }
  }
`;

// ─── Followers ────────────────────────────────────────────────────────────────

export const FOLLOW_USER = gql`
  mutation FollowUser($userId: String!) {
    followUser(userId: $userId) { id }
  }
`;

export const UNFOLLOW_USER = gql`
  mutation UnfollowUser($userId: String!) {
    unfollowUser(userId: $userId) { id }
  }
`;

// ─── Reports ──────────────────────────────────────────────────────────────────

export const CREATE_REPORT = gql`
  mutation CreateReport($input: CreateReportInput!) {
    createReport(input: $input) { id status }
  }
`;

export const UPDATE_REPORT_STATUS = gql`
  mutation UpdateReportStatus($id: String!, $status: ReportStatus!, $note: String) {
    updateReportStatus(id: $id, status: $status, note: $note) {
      id status reviewedAt resolutionNote
      reviewedBy { id name }
    }
  }
`;

export const DELETE_REPORTS = gql`
  mutation DeleteReports($ids: [String!]!) {
    deleteReports(ids: $ids)
  }
`;

// ─── Notifications ────────────────────────────────────────────────────────────

export const MARK_NOTIFICATION_READ = gql`
  mutation MarkNotificationRead($id: String!) {
    markNotificationRead(id: $id) { id read }
  }
`;

export const MARK_ALL_NOTIFICATIONS_READ = gql`
  mutation MarkAllNotificationsRead {
    markAllNotificationsRead
  }
`;

export const DELETE_NOTIFICATION = gql`
  mutation DeleteNotification($id: String!) {
    deleteNotification(id: $id) { id }
  }
`;

export const DELETE_ALL_NOTIFICATIONS = gql`
  mutation DeleteAllNotifications {
    deleteAllNotifications
  }
`;

export const SEND_MARKETING_NOTIFICATION = gql`
  mutation SendMarketingNotification($input: BroadcastInput!) {
    sendMarketingNotification(input: $input)
  }
`;

export const SEND_SYSTEM_NOTIFICATION = gql`
  mutation SendSystemNotification($input: BroadcastInput!) {
    sendSystemNotification(input: $input)
  }
`;

// ─── Categories ──────────────────────────────────────────────────────────────

export const CREATE_CATEGORY = gql`
  mutation CreateCategory($input: CreateCategoryInput!) {
    createCategory(input: $input) { id slug label color icon parentId }
  }
`;

export const UPDATE_CATEGORY = gql`
  mutation UpdateCategory($id: String!, $input: UpdateCategoryInput!) {
    updateCategory(id: $id, input: $input) { id slug label color icon parentId }
  }
`;

export const DELETE_CATEGORY = gql`
  mutation DeleteCategory($id: String!) {
    deleteCategory(id: $id) { id }
  }
`;

// ─── Home sections ──────────────────────────────────────────────────────────

const HOME_SECTION_FIELDS = `
  id type title subtitle icon filter config sortOrder visible
  notifyOnCreate minResults startsAt endsAt createdAt updatedAt
  createdBy { id name }
`;

export const CREATE_HOME_SECTION = gql`
  mutation CreateHomeSection($input: CreateHomeSectionInput!) {
    createHomeSection(input: $input) { ${HOME_SECTION_FIELDS} }
  }
`;

export const UPDATE_HOME_SECTION = gql`
  mutation UpdateHomeSection($id: String!, $input: UpdateHomeSectionInput!) {
    updateHomeSection(id: $id, input: $input) { ${HOME_SECTION_FIELDS} }
  }
`;

export const DELETE_HOME_SECTION = gql`
  mutation DeleteHomeSection($id: String!) {
    deleteHomeSection(id: $id)
  }
`;

export const REORDER_HOME_SECTIONS = gql`
  mutation ReorderHomeSections($ids: [String!]!) {
    reorderHomeSections(ids: $ids) { ${HOME_SECTION_FIELDS} }
  }
`;

export const ACCEPT_HOME_SUGGESTION = gql`
  mutation AcceptHomeSuggestion($id: String!) {
    acceptHomeSuggestion(id: $id) { ${HOME_SECTION_FIELDS} }
  }
`;

export const DISMISS_HOME_SUGGESTION = gql`
  mutation DismissHomeSuggestion($id: String!) {
    dismissHomeSuggestion(id: $id) {
      id status reviewedAt
      reviewedBy { id name }
    }
  }
`;

export const RUN_STATS_ANALYZER = gql`
  mutation RunStatsAnalyzer {
    runStatsAnalyzer
  }
`;

// ─── Plans ──────────────────────────────────────────────────────────────────

export const CHANGE_PLAN = gql`
  mutation ChangePlan($input: ChangePlanInput!) {
    changePlan(input: $input) {
      id name plan planExpiresAt
    }
  }
`;

export const GET_PLAN_HISTORY = gql`
  query PlanHistory($userId: String!) {
    planHistory(userId: $userId) {
      id oldPlan newPlan expiresAt reason changedById createdAt
    }
  }
`;

// ─── Verifications ───────────────────────────────────────────────────────────

export const APPROVE_VERIFICATION = gql`
  mutation ApproveVerification($id: String!) {
    approveVerification(id: $id) {
      id
      status
      reviewedAt
      reviewedBy { id name }
    }
  }
`;

export const REJECT_VERIFICATION = gql`
  mutation RejectVerification($id: String!, $reason: String) {
    rejectVerification(id: $id, reason: $reason) {
      id
      status
      rejectedReason
      reviewedAt
      reviewedBy { id name }
    }
  }
`;

export const DELETE_VERIFICATION_REQUESTS = gql`
  mutation DeleteVerificationRequests($ids: [String!]!) {
    deleteVerificationRequests(ids: $ids)
  }
`;
