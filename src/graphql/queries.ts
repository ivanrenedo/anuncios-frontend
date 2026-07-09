import { gql } from "@apollo/client";

// ─── Auth / User ──────────────────────────────────────────────────────────────

export const ME = gql`
  query Me {
    me {
      id name email phone avatarUrl coverUrl bio location
      verified language
      notifMessages notifOffers notifMarketing
      showEmail showPhone themePreference
      createdAt updatedAt
    }
  }
`;

export const ADMIN_ME = gql`
  query AdminMe {
    me {
      id name email phone avatarUrl coverUrl bio location verified permission rolId createdAt
      notifMessages notifOffers notifMarketing showEmail showPhone language themePreference
    }
  }
`;

export const GET_USER = gql`
  query User($id: String!) {
    user(id: $id) {
      id name email phone avatarUrl coverUrl bio location
      verified language createdAt showEmail showPhone
    }
  }
`;

export const GET_USERS = gql`
  query Users {
    users {
      id name email avatarUrl verified location createdAt rolId permission
    }
  }
`;

export const GET_ROLES = gql`
  query Roles {
    roles {
      id label description createdAt actions
      createdBy { id name }
    }
  }
`;

// ─── Products ─────────────────────────────────────────────────────────────────

export const GET_PRODUCTS = gql`
  query Products($take: Int, $skip: Int) {
    products(take: $take, skip: $skip) {
      id title description price discount condition city status views favoritesCount
      createdAt
      seller { id name avatarUrl verified location }
      category { id slug label color }
      images { id url sortOrder }
    }
  }
`;

// Admin-only: every product regardless of status (the public `products`
// query returns active only).
export const GET_ALL_PRODUCTS = gql`
  query AllProducts($take: Int, $skip: Int) {
    allProducts(take: $take, skip: $skip) {
      id title description price discount condition city status views favoritesCount
      createdAt
      seller { id name avatarUrl verified location }
      category { id slug label color }
      images { id url sortOrder }
    }
  }
`;

export const GET_PRODUCT = gql`
  query Product($id: String!) {
    product(id: $id) {
      id title description price discount condition city status views favoritesCount
      createdAt
      seller { id name avatarUrl verified location bio }
      category { id slug label color }
      images { id url sortOrder }
      attributes { id label value }
      marketplaceDetail { brand model }
      vehicleDetail { vehicleType brand model year transmission engine }
      propertyDetail { operation propertyType bedrooms bathrooms address }
      serviceDetail { serviceType offerType }
      jobDetail { jobType link }
    }
  }
`;

export const SEARCH_PRODUCTS = gql`
  query SearchProducts($input: SearchProductsInput!) {
    searchProducts(input: $input) {
      id title description price discount condition city status views favoritesCount
      createdAt
      seller { id name avatarUrl verified location }
      category { id slug label color }
      images { id url sortOrder }
    }
  }
`;

export const PRODUCTS_BY_CATEGORY = gql`
  query ProductsByCategory($categoryId: String!, $take: Int, $skip: Int) {
    productsByCategory(categoryId: $categoryId, take: $take, skip: $skip) {
      id title price discount condition city views favoritesCount createdAt
      seller { id name avatarUrl verified }
      category { id slug label color }
      images { id url sortOrder }
    }
  }
`;

export const PRODUCTS_BY_SELLER = gql`
  query ProductsBySeller($sellerId: String!) {
    productsBySeller(sellerId: $sellerId) {
      id title price discount condition city status views favoritesCount createdAt
      category { id slug label color }
      images { id url sortOrder }
    }
  }
`;

// ─── Categories ──────────────────────────────────────────────────────────────

export const GET_CATEGORIES = gql`
  query Categories {
    categories {
      id slug label color icon parentId sortOrder
    }
  }
`;

export const CATEGORY_BY_SLUG = gql`
  query CategoryBySlug($slug: String!) {
    categoryBySlug(slug: $slug) {
      id slug label color icon
    }
  }
`;

// ─── Favorites ────────────────────────────────────────────────────────────────

export const MY_FAVORITES = gql`
  query MyFavorites {
    myFavorites {
      id createdAt
      product {
        id title price discount condition city views favoritesCount createdAt
        seller { id name avatarUrl verified }
        category { id slug label color }
        images { id url sortOrder }
      }
    }
  }
`;

export const IS_FAVORITED = gql`
  query IsFavorited($productId: String!) {
    isFavorited(productId: $productId)
  }
`;

export const FAVORITES_BY_USER = gql`
  query FavoritesByUser($userId: String!) {
    favoritesByUser(userId: $userId) {
      id createdAt
      product {
        id title price status
        images { id url sortOrder }
      }
    }
  }
`;

// ─── Reviews ──────────────────────────────────────────────────────────────────

export const REVIEWS_BY_SELLER = gql`
  query ReviewsBySeller($sellerId: String!) {
    reviewsBySeller(sellerId: $sellerId) {
      id rating text createdAt
      author { id name avatarUrl }
    }
  }
`;

export const REVIEWS_BY_AUTHOR = gql`
  query ReviewsByAuthor($authorId: String!) {
    reviewsByAuthor(authorId: $authorId) {
      id rating text createdAt
      seller { id name avatarUrl }
    }
  }
`;

export const SELLER_RATING = gql`
  query SellerRating($sellerId: String!) {
    sellerRating(sellerId: $sellerId) { average count }
  }
`;

export const TOP_RATED_SELLERS = gql`
  query TopRatedSellers($limit: Int) {
    topRatedSellers(limit: $limit) {
      sellerId
      name
      average
      count
    }
  }
`;

export const REVIEW_STATS = gql`
  query ReviewStats {
    reviewStats {
      average
      count
      distribution { stars count }
    }
  }
`;

// ─── Followers ────────────────────────────────────────────────────────────────

export const GET_FOLLOWERS = gql`
  query Followers($userId: String!) {
    followers(userId: $userId) {
      id createdAt
      follower { id name avatarUrl verified location }
    }
  }
`;

export const GET_FOLLOWING = gql`
  query Following($userId: String!) {
    following(userId: $userId) {
      id createdAt
      followed { id name avatarUrl verified location }
    }
  }
`;

export const IS_FOLLOWING = gql`
  query IsFollowing($userId: String!) {
    isFollowing(userId: $userId)
  }
`;

// ─── Reports (admin) ───────────────────────────────────────────────────────────

export const GET_REPORTS = gql`
  query Reports {
    reports {
      id type reason description status createdAt
      reviewedAt resolutionNote
      reviewedBy { id name }
      reporter { id name avatarUrl }
      reportedUser { id name avatarUrl location }
      product { id title images { id url sortOrder } }
    }
  }
`;

// ─── Home sections (admin) ────────────────────────────────────────────────────

export const GET_ADMIN_HOME_SECTIONS = gql`
  query AdminHomeSections {
    adminHomeSections {
      id type title subtitle icon filter config sortOrder visible
      notifyOnCreate minResults startsAt endsAt createdAt updatedAt
      createdBy { id name }
    }
  }
`;

export const GET_HOME_SUGGESTIONS = gql`
  query HomeSuggestions {
    homeSuggestions {
      id type title reason filter score status createdAt
      reviewedBy { id name }
    }
  }
`;

export const GET_HOME_SECTION_STATS = gql`
  query HomeSectionStats {
    homeSectionStats { sectionId impressions clicks ctr }
  }
`;

export const PREVIEW_FILTER_COUNT = gql`
  query PreviewFilterCount($filter: JSON!) {
    previewFilterCount(filter: $filter)
  }
`;

// ─── Notifications ────────────────────────────────────────────────────────────

export const GET_NOTIFICATIONS = gql`
  query Notifications {
    notifications {
      id type title body read avatar createdAt
    }
  }
`;

export const UNREAD_COUNT = gql`
  query UnreadNotificationsCount {
    unreadNotificationsCount
  }
`;

// ─── Verifications ───────────────────────────────────────────────────────────

export const GET_VERIFICATION_REQUESTS = gql`
  query VerificationRequests {
    verificationRequests {
      id
      userId
      status
      rejectedReason
      reviewedAt
      createdAt
      user {
        id
        name
        email
        phone
        avatarUrl
        verified
        location
        createdAt
      }
      reviewedBy {
        id
        name
      }
    }
  }
`;
