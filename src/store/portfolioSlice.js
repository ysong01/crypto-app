import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import axios from 'axios';

const PORTFOLIO_API = 'https://hammerhead-app-cpxzd.ondigitalocean.app/api';

// Get user from localStorage
const userFromStorage = localStorage.getItem('user')
  ? JSON.parse(localStorage.getItem('user'))
  : null;

const tokenFromStorage = localStorage.getItem('token') || null;

export const loginUser = createAsyncThunk(
  'portfolio/login',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${PORTFOLIO_API}/auth/login`, userData, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      localStorage.setItem('user', JSON.stringify(response.data));
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Login failed');
    }
  }
);

export const registerUser = createAsyncThunk(
  'portfolio/register',
  async (userData, { rejectWithValue }) => {
    try {
      const response = await axios.post(`${PORTFOLIO_API}/auth/register`, userData, {
        headers: {
          'Content-Type': 'application/json'
        },
        withCredentials: true
      });
      localStorage.setItem('user', JSON.stringify(response.data));
      localStorage.setItem('token', response.data.token);
      return response.data;
    } catch (error) {
      return rejectWithValue(error.response?.data?.message || 'Registration failed');
    }
  }
);

export const fetchPortfolios = createAsyncThunk(
  'portfolio/fetchPortfolios',
  async (_, { getState }) => {
    const { token } = getState().portfolio;
    const response = await axios.get(`${PORTFOLIO_API}/portfolios`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  }
);

const portfolioSlice = createSlice({
  name: 'portfolio',
  initialState: {
    user: userFromStorage,
    token: tokenFromStorage,
    portfolios: [],
    loading: false,
    error: null
  },
  reducers: {
    logout: (state) => {
      state.user = null;
      state.token = null;
      state.portfolios = [];
      localStorage.removeItem('user');
      localStorage.removeItem('token');
    }
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Register
      .addCase(registerUser.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(registerUser.fulfilled, (state, action) => {
        state.loading = false;
        state.user = action.payload;
        state.token = action.payload.token;
      })
      .addCase(registerUser.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload;
      })
      // Fetch Portfolios
      .addCase(fetchPortfolios.fulfilled, (state, action) => {
        state.portfolios = action.payload;
      });
  }
});

export const { logout } = portfolioSlice.actions;
export default portfolioSlice.reducer; 