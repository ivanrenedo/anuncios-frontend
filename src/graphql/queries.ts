import { gql } from "@apollo/client";

// ─── Auth / User ──────────────────────────────────────────────────────────────

export const ME = gql`
  query Me {
    me {
      id
      name
      email
      phone
      avatarUrl
      coverUrl
      bio
      location
      verified
      permission
      suspended
      suspendedReason
      language
      plan
      planExpiresAt
      effectivePlan
      maxActiveProducts
      maxImagesPerProduct
      notifMessages
      notifOffers
      notifMarketing
      showEmail
      showPhone
      themePreference
      createdAt
      updatedAt
    }
  }
`;

export const ADMIN_ME = gql`
  query AdminMe {
    me {
      id
      name
      email
      phone
      avatarUrl
      coverUrl
      bio
      location
      verified
      permission
      rolId
      createdAt
      notifMessages
      notifOffers
      notifMarketing
      showEmail
      showPhone
      language
      themePreference
    }
  }
`;

export const GET_USER = gql`
  query User($id: String!) {
    user(id: $id) {
      id
      name
      email
      phone
      avatarUrl
      coverUrl
      bio
      location
      verified
      plan
      planExpiresAt
      language
      createdAt
      showEmail
      showPhone
    }
  }
`;

export const GET_USERS = gql`
  query Users($take: Int, $skip: Int, $query: String) {
    users(take: $take, skip: $skip, query: $query) {
      id
      name
      email
      phone
      avatarUrl
      verified
      location
      createdAt
      rolId
      permission
      plan
      planExpiresAt
      suspended
      suspendedReason
      isBusiness
    }
  }
`;

export const GET_SAVED_SEARCH_STATS = gql`
  query SavedSearchStats($limit: Int) {
    savedSearchStats(limit: $limit) {
      term
      count
    }
  }
`;

export const GET_ADMIN_ACTIONS = gql`
  query AdminActions($take: Int, $skip: Int) {
    adminActions(take: $take, skip: $skip) {
      id
      action
      targetType
      targetId
      detail
      createdAt
      admin { id name avatarUrl }
    }
  }
`;

export const GET_PAYMENTS = gql`
  query Payments($take: Int, $skip: Int) {
    payments(take: $take, skip: $skip) {
      id
      amount
      currency
      concept
      note
      productId
      createdAt
      user { id name email avatarUrl }
      createdBy { id name }
    }
  }
`;

export const GET_ROLES = gql`
  query Roles {
    roles {
      id
      label
      description
      createdAt
      actions
      createdBy {
        id
        name
      }
    }
  }
`;

// ─── Products ─────────────────────────────────────────────────────────────────

const PRODUCT_CARD_FIELDS = `
  id
  title
  description
  price
  discount
  condition
  city
  status
  views
  favoritesCount
  bumpedAt
  boostedUntil
  createdAt
  seller {
    id
    name
    avatarUrl
    verified
    plan
    location
  }
  category {
    id
    slug
    label
    color
  }
  images {
    id
    url
    sortOrder
        type
        thumbnailUrl
  }
`;

export const GET_PRODUCTS = gql`
  query Products($take: Int, $skip: Int) {
    products(take: $take, skip: $skip) {
      ${PRODUCT_CARD_FIELDS}
      attributes { id label value }
      marketplaceDetail { brand model colors }
      vehicleDetail { id operation brand model year kilometrage transmission engine colors }
      propertyDetail { id operation bedrooms bathrooms floor surface address }
      serviceDetail { id offerType }
      jobDetail { id link }
    }
  }
`;

export const GET_ALL_PRODUCTS = gql`
  query AllProducts($take: Int, $skip: Int, $query: String) {
    allProducts(take: $take, skip: $skip, query: $query) {
      ${PRODUCT_CARD_FIELDS}
    }
  }
`;

export const GET_PRODUCT = gql`
  query Product($id: String!) {
    product(id: $id) {
      id
      title
      description
      price
      discount
      condition
      city
      status
      views
      favoritesCount
      bumpedAt
      boostedUntil
      createdAt
      seller {
        id
        name
        avatarUrl
        verified
        location
        bio
        plan
        phone
        showPhone
      }
      category {
        id
        slug
        label
        color
        parentId
      }
      images {
        id
        url
        sortOrder
        type
        thumbnailUrl
      }
      attributes {
        id
        label
        value
      }
      marketplaceDetail {
        brand
        model
        colors
      }
      vehicleDetail {
        id
        operation
        brand
        model
        year
        kilometrage
        transmission
        engine
        colors
      }
      propertyDetail {
        id
        operation
        bedrooms
        bathrooms
        floor
        surface
        address
      }
      serviceDetail {
        id
        offerType
      }
      jobDetail {
        id
        link
      }
    }
  }
`;

export const SEARCH_PRODUCTS = gql`
  query SearchProducts($input: SearchProductsInput!) {
    searchProducts(input: $input) {
      ${PRODUCT_CARD_FIELDS}
      propertyDetail { operation bedrooms bathrooms surface }
      serviceDetail { offerType }
      vehicleDetail { operation brand model engine transmission }
    }
  }
`;

export const PRODUCTS_BY_CATEGORY = gql`
  query ProductsByCategory($categoryId: String!, $take: Int, $skip: Int) {
    productsByCategory(categoryId: $categoryId, take: $take, skip: $skip) {
      ${PRODUCT_CARD_FIELDS}
    }
  }
`;

export const PRODUCTS_BY_SELLER = gql`
  query ProductsBySeller($sellerId: String!) {
    productsBySeller(sellerId: $sellerId) {
      id
      title
      price
      discount
      condition
      city
      status
      views
      favoritesCount
      contacts
      impressions
      bumpedAt
      boostedUntil
      createdAt
      category {
        id
        slug
        label
        color
      }
      images {
        id
        url
        sortOrder
        type
        thumbnailUrl
      }
      vehicleDetail { operation }
      propertyDetail { operation }
      serviceDetail { offerType }
    }
  }
`;

// ─── Categories ──────────────────────────────────────────────────────────────

export const GET_CATEGORIES = gql`
  query Categories {
    categories {
      id
      slug
      label
      color
      icon
      parentId
      sortOrder
    }
  }
`;

export const CATEGORY_TREE = gql`
  query CategoryTree {
    categoryTree {
      id
      slug
      label
      color
      icon
      sortOrder
      children {
        id
        slug
        label
        color
        icon
        sortOrder
        children {
          id
          slug
          label
          sortOrder
        }
      }
    }
  }
`;

// ─── Favorites ────────────────────────────────────────────────────────────────

export const MY_FAVORITES = gql`
  query MyFavorites {
    myFavorites {
      id
      createdAt
      product {
        ${PRODUCT_CARD_FIELDS}
        vehicleDetail { operation }
        propertyDetail { operation }
        serviceDetail { offerType }
      }
    }
  }
`;

export const FAVORITES_BY_USER = gql`
  query FavoritesByUser($userId: String!) {
    favoritesByUser(userId: $userId) {
      id
      createdAt
      product {
        id
        title
        price
        status
        images {
          id
          url
          sortOrder
        type
        thumbnailUrl
        }
      }
    }
  }
`;

// ─── Reviews ──────────────────────────────────────────────────────────────────

export const REVIEWS_BY_SELLER = gql`
  query ReviewsBySeller($sellerId: String!) {
    reviewsBySeller(sellerId: $sellerId) {
      id
      rating
      text
      createdAt
      author {
        id
        name
        avatarUrl
      }
    }
  }
`;

export const REVIEWS_BY_AUTHOR = gql`
  query ReviewsByAuthor($authorId: String!) {
    reviewsByAuthor(authorId: $authorId) {
      id
      rating
      text
      createdAt
      seller {
        id
        name
        avatarUrl
      }
    }
  }
`;

export const SELLER_RATING = gql`
  query SellerRating($sellerId: String!) {
    sellerRating(sellerId: $sellerId) {
      average
      count
    }
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
      distribution {
        stars
        count
      }
    }
  }
`;

// ─── Followers ────────────────────────────────────────────────────────────────

export const GET_FOLLOWERS = gql`
  query Followers($userId: String!) {
    followers(userId: $userId) {
      id
      createdAt
      follower {
        id
        name
        avatarUrl
        verified
        location
        plan
      }
    }
  }
`;

export const GET_FOLLOWING = gql`
  query Following($userId: String!) {
    following(userId: $userId) {
      id
      createdAt
      followed {
        id
        name
        avatarUrl
        verified
        location
        plan
      }
    }
  }
`;

export const IS_FOLLOWING = gql`
  query IsFollowing($userId: String!) {
    isFollowing(userId: $userId)
  }
`;

export const FOLLOWERS_COUNT = gql`
  query FollowersCount($userId: String!) {
    followersCount(userId: $userId)
  }
`;

export const FOLLOWING_COUNT = gql`
  query FollowingCount($userId: String!) {
    followingCount(userId: $userId)
  }
`;

// ─── Business contact ───────────────────────────────────────────────────────

export const BUSINESS_CONTACT = gql`
  query BusinessContact {
    businessContact {
      phone
      email
    }
  }
`;

// ─── PREMIUM stats ──────────────────────────────────────────────────────────

export const MY_VIEWS_DAILY = gql`
  query MyViewsDaily($days: Int) {
    myViewsDaily(days: $days) {
      date
      count
    }
  }
`;

// ─── Saved Searches ──────────────────────────────────────────────────────────

export const MY_SAVED_SEARCHES = gql`
  query MySavedSearches {
    mySavedSearches {
      id
      query
      categoryId
      city
      priceMin
      priceMax
      createdAt
    }
  }
`;

// ─── Reports (admin) ───────────────────────────────────────────────────────────

export const GET_REPORTS = gql`
  query Reports {
    reports {
      id
      type
      reason
      description
      status
      createdAt
      reviewedAt
      resolutionNote
      reviewedBy {
        id
        name
      }
      reporter {
        id
        name
        avatarUrl
      }
      reportedUser {
        id
        name
        avatarUrl
        location
      }
      product {
        id
        title
        images {
          id
          url
          sortOrder
        type
        thumbnailUrl
        }
      }
    }
  }
`;

// ─── Home sections ───────────────────────────────────────────────────────────

export const GET_HOME_SECTIONS = gql`
  query HomeSections($viewerKey: String) {
    homeSections(viewerKey: $viewerKey) {
      id
      type
      title
      subtitle
      icon
      filter
      config
      sortOrder
      products {
        ${PRODUCT_CARD_FIELDS}
        vehicleDetail { operation }
        propertyDetail { operation }
        serviceDetail { offerType }
      }
    }
  }
`;

export const GET_FILTERABLE_SECTIONS = gql`
  query FilterableSections {
    filterableSections {
      id
      type
      title
      icon
      filter
    }
  }
`;

export const GET_SECTION_PRODUCTS = gql`
  query SectionProducts($sectionId: String!, $take: Int, $skip: Int) {
    sectionProducts(sectionId: $sectionId, take: $take, skip: $skip) {
      ${PRODUCT_CARD_FIELDS}
      vehicleDetail { operation brand model engine transmission }
      propertyDetail { operation bedrooms bathrooms surface }
      serviceDetail { offerType }
    }
  }
`;

export const GET_ADMIN_HOME_SECTIONS = gql`
  query AdminHomeSections {
    adminHomeSections {
      id
      type
      title
      subtitle
      icon
      filter
      config
      sortOrder
      visible
      notifyOnCreate
      minResults
      startsAt
      endsAt
      createdAt
      updatedAt
      createdBy {
        id
        name
      }
    }
  }
`;

export const GET_HOME_SUGGESTIONS = gql`
  query HomeSuggestions {
    homeSuggestions {
      id
      type
      title
      reason
      filter
      score
      status
      createdAt
      reviewedBy {
        id
        name
      }
    }
  }
`;

export const GET_HOME_SECTION_STATS = gql`
  query HomeSectionStats {
    homeSectionStats {
      sectionId
      impressions
      clicks
      ctr
    }
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
      id
      type
      title
      body
      read
      avatar
      relatedProductId
      relatedUserId
      sectionId
      filterCat
      createdAt
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

export const MY_VERIFICATION_REQUEST = gql`
  query MyVerificationRequest {
    myVerificationRequest {
      id
      status
      rejectedReason
      reviewedAt
      createdAt
    }
  }
`;
