/**
 * India Geographic Boundary & Administrative Division Reference
 * NASA Space Apps Challenge 2026 - FireSync
 * Provides bounding boxes and centroid coordinates for fire-prone Indian states and districts.
 */

export const INDIA_BOUNDS = {
  center: [22.9734, 78.6569],
  zoom: 5,
  bounds: [[8.0, 68.0], [37.0, 97.5]],
};

export const INDIA_STATES = [
  {
    id: 'ALL',
    name: 'All India (National Overview)',
    center: [22.9734, 78.6569],
    zoom: 5,
    bounds: [[8.0, 68.0], [37.0, 97.5]],
    districts: [],
  },
  {
    id: 'PB',
    name: 'Punjab',
    center: [30.9010, 75.8573],
    zoom: 8,
    bounds: [[29.5, 73.8], [32.5, 76.9]],
    districts: [
      { id: 'ALL_PB', name: 'All Punjab Districts', center: [30.9010, 75.8573], zoom: 8, bounds: [[29.5, 73.8], [32.5, 76.9]] },
      { id: 'LDH', name: 'Ludhiana', center: [30.9010, 75.8573], zoom: 10, bounds: [[30.6, 75.5], [31.1, 76.2]] },
      { id: 'ASR', name: 'Amritsar', center: [31.6340, 74.8723], zoom: 10, bounds: [[31.4, 74.6], [31.9, 75.3]] },
      { id: 'FZP', name: 'Firozpur', center: [30.9237, 74.6117], zoom: 10, bounds: [[30.6, 74.3], [31.2, 75.1]] },
      { id: 'SGR', name: 'Sangrur', center: [30.2458, 75.8421], zoom: 10, bounds: [[30.0, 75.6], [30.4, 76.1]] },
      { id: 'BTI', name: 'Bathinda', center: [30.2110, 74.9455], zoom: 10, bounds: [[29.9, 74.7], [30.4, 75.3]] },
      { id: 'PTL', name: 'Patiala', center: [30.3398, 76.3869], zoom: 10, bounds: [[30.1, 76.1], [30.6, 76.7]] },
      { id: 'JAL', name: 'Jalandhar', center: [31.3260, 75.5762], zoom: 10, bounds: [[31.1, 75.3], [31.5, 75.9]] },
      { id: 'TTN', name: 'Tarn Taran', center: [31.4518, 74.9281], zoom: 10, bounds: [[31.2, 74.7], [31.6, 75.2]] },
    ],
  },
  {
    id: 'HR',
    name: 'Haryana',
    center: [29.0588, 76.0856],
    zoom: 8,
    bounds: [[27.6, 74.5], [30.9, 77.6]],
    districts: [
      { id: 'ALL_HR', name: 'All Haryana Districts', center: [29.0588, 76.0856], zoom: 8, bounds: [[27.6, 74.5], [30.9, 77.6]] },
      { id: 'KRN', name: 'Karnal', center: [29.6857, 76.9905], zoom: 10, bounds: [[29.4, 76.7], [29.9, 77.2]] },
      { id: 'KTH', name: 'Kaithal', center: [29.8015, 76.3996], zoom: 10, bounds: [[29.6, 76.1], [30.1, 76.7]] },
      { id: 'KRK', name: 'Kurukshetra', center: [29.9695, 76.8783], zoom: 10, bounds: [[29.8, 76.6], [30.2, 77.1]] },
      { id: 'FTB', name: 'Fatehabad', center: [29.5147, 75.4526], zoom: 10, bounds: [[29.3, 75.2], [29.9, 76.0]] },
      { id: 'HSR', name: 'Hisar', center: [29.1492, 75.7217], zoom: 10, bounds: [[28.9, 75.4], [29.4, 76.2]] },
      { id: 'SRS', name: 'Sirsa', center: [29.5349, 75.0298], zoom: 10, bounds: [[29.2, 74.5], [29.9, 75.4]] },
      { id: 'AMB', name: 'Ambala', center: [30.3782, 76.7767], zoom: 10, bounds: [[30.2, 76.6], [30.6, 77.2]] },
    ],
  },
  {
    id: 'MP',
    name: 'Madhya Pradesh',
    center: [23.4733, 77.9479],
    zoom: 7,
    bounds: [[21.0, 74.0], [26.8, 82.8]],
    districts: [
      { id: 'ALL_MP', name: 'All Madhya Pradesh Districts', center: [23.4733, 77.9479], zoom: 7, bounds: [[21.0, 74.0], [26.8, 82.8]] },
      { id: 'BPL', name: 'Bhopal', center: [23.2599, 77.4126], zoom: 10, bounds: [[23.1, 77.1], [23.5, 77.6]] },
      { id: 'IDR', name: 'Indore', center: [22.7196, 75.8577], zoom: 10, bounds: [[22.5, 75.6], [22.9, 76.1]] },
      { id: 'JBL', name: 'Jabalpur', center: [23.1815, 79.9864], zoom: 10, bounds: [[22.9, 79.7], [23.4, 80.3]] },
      { id: 'HSH', name: 'Narmadapuram (Hoshangabad)', center: [22.7519, 77.7289], zoom: 10, bounds: [[22.4, 77.4], [22.9, 78.4]] },
      { id: 'SHR', name: 'Sehore', center: [23.2031, 77.0844], zoom: 10, bounds: [[22.8, 76.8], [23.4, 77.4]] },
    ],
  },
  {
    id: 'RJ',
    name: 'Rajasthan',
    center: [26.5844, 73.8496],
    zoom: 7,
    bounds: [[23.0, 69.5], [30.2, 78.2]],
    districts: [
      { id: 'ALL_RJ', name: 'All Rajasthan Districts', center: [26.5844, 73.8496], zoom: 7, bounds: [[23.0, 69.5], [30.2, 78.2]] },
      { id: 'GNG', name: 'Sri Ganganagar', center: [29.9038, 73.8772], zoom: 10, bounds: [[29.4, 73.3], [30.2, 74.4]] },
      { id: 'HNM', name: 'Hanumangarh', center: [29.5813, 74.3294], zoom: 10, bounds: [[29.1, 74.0], [29.9, 75.3]] },
      { id: 'JPR', name: 'Jaipur', center: [26.9124, 75.7873], zoom: 10, bounds: [[26.6, 75.4], [27.2, 76.2]] },
      { id: 'KTA', name: 'Kota', center: [25.2138, 75.8648], zoom: 10, bounds: [[24.8, 75.6], [25.5, 76.3]] },
    ],
  },
  {
    id: 'UP',
    name: 'Uttar Pradesh',
    center: [27.1303, 80.8597],
    zoom: 7,
    bounds: [[23.8, 77.0], [30.4, 84.6]],
    districts: [
      { id: 'ALL_UP', name: 'All Uttar Pradesh Districts', center: [27.1303, 80.8597], zoom: 7, bounds: [[23.8, 77.0], [30.4, 84.6]] },
      { id: 'LKO', name: 'Lucknow', center: [26.8467, 80.9462], zoom: 10, bounds: [[26.6, 80.7], [27.1, 81.2]] },
      { id: 'KNP', name: 'Kanpur', center: [26.4499, 80.3319], zoom: 10, bounds: [[26.2, 80.1], [26.7, 80.6]] },
      { id: 'VNS', name: 'Varanasi', center: [25.3176, 82.9739], zoom: 10, bounds: [[25.1, 82.8], [25.5, 83.2]] },
      { id: 'MTR', name: 'Mathura', center: [27.4924, 77.6737], zoom: 10, bounds: [[27.3, 77.4], [27.8, 77.9]] },
      { id: 'PLB', name: 'Pilibhit', center: [28.6312, 79.8037], zoom: 10, bounds: [[28.3, 79.6], [28.9, 80.4]] },
    ],
  },
  {
    id: 'MH',
    name: 'Maharashtra',
    center: [19.7515, 75.7139],
    zoom: 7,
    bounds: [[15.6, 72.6], [22.0, 80.9]],
    districts: [
      { id: 'ALL_MH', name: 'All Maharashtra Districts', center: [19.7515, 75.7139], zoom: 7, bounds: [[15.6, 72.6], [22.0, 80.9]] },
      { id: 'NGP', name: 'Nagpur', center: [21.1458, 79.0882], zoom: 10, bounds: [[20.9, 78.8], [21.5, 79.5]] },
      { id: 'PUN', name: 'Pune', center: [18.5204, 73.8567], zoom: 10, bounds: [[18.3, 73.6], [18.9, 74.2]] },
      { id: 'CHP', name: 'Chandrapur', center: [19.9615, 79.2961], zoom: 10, bounds: [[19.6, 78.9], [20.4, 79.8]] },
      { id: 'GDC', name: 'Gadchiroli', center: [20.1809, 80.0039], zoom: 10, bounds: [[18.7, 79.7], [20.5, 80.9]] },
    ],
  },
  {
    id: 'CG',
    name: 'Chhattisgarh',
    center: [21.2787, 81.8661],
    zoom: 7,
    bounds: [[17.8, 80.2], [24.1, 84.4]],
    districts: [
      { id: 'ALL_CG', name: 'All Chhattisgarh Districts', center: [21.2787, 81.8661], zoom: 7, bounds: [[17.8, 80.2], [24.1, 84.4]] },
      { id: 'RPR', name: 'Raipur', center: [21.2514, 81.6296], zoom: 10, bounds: [[21.0, 81.4], [21.6, 82.0]] },
      { id: 'BST', name: 'Bastar', center: [19.0734, 82.0298], zoom: 10, bounds: [[18.8, 81.6], [19.5, 82.3]] },
    ],
  },
  {
    id: 'OD',
    name: 'Odisha',
    center: [20.9517, 85.0985],
    zoom: 7,
    bounds: [[17.8, 81.4], [22.6, 87.5]],
    districts: [
      { id: 'ALL_OD', name: 'All Odisha Districts', center: [20.9517, 85.0985], zoom: 7, bounds: [[17.8, 81.4], [22.6, 87.5]] },
      { id: 'MYB', name: 'Mayurbhanj', center: [21.9287, 86.7378], zoom: 10, bounds: [[21.6, 85.7], [22.5, 86.9]] },
      { id: 'KRP', name: 'Koraput', center: [18.8135, 82.7118], zoom: 10, bounds: [[18.4, 82.3], [19.2, 83.2]] },
    ],
  },
];

