#!/usr/bin/env python3
"""
Backend API Testing for Semillero Digital Classroom Enhancer
Tests authentication, user management, and dashboard endpoints
"""

import requests
import json
import sys
from datetime import datetime
import uuid

# Configuration
BASE_URL = "https://classroom-enhancer.preview.emergentagent.com/api"
TEST_SESSION_ID = "test_session_12345"  # Mock session ID for testing

class BackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.session_token = None
        self.test_user_id = None
        self.results = {
            "auth_tests": {},
            "user_management_tests": {},
            "dashboard_tests": {},
            "overall_status": "PENDING"
        }
    
    def log_test(self, test_name, status, message, response=None):
        """Log test results"""
        print(f"[{status}] {test_name}: {message}")
        if response:
            print(f"    Response Status: {response.status_code}")
            if response.status_code >= 400:
                print(f"    Response Body: {response.text[:500]}")
        
        category = "auth_tests" if "auth" in test_name.lower() else \
                  "user_management_tests" if "user" in test_name.lower() else \
                  "dashboard_tests"
        
        self.results[category][test_name] = {
            "status": status,
            "message": message,
            "response_code": response.status_code if response else None
        }
    
    def test_auth_session_endpoint(self):
        """Test /api/auth/session endpoint with mock session_id"""
        print("\n=== Testing Auth Session Endpoint ===")
        
        try:
            # Test with valid mock session_id
            payload = {"session_id": TEST_SESSION_ID}
            response = self.session.post(f"{BASE_URL}/auth/session", json=payload)
            
            if response.status_code == 200:
                data = response.json()
                if "user" in data and "message" in data:
                    self.session_token = response.cookies.get('session_token')
                    if data["user"].get("id"):
                        self.test_user_id = data["user"]["id"]
                    self.log_test("Auth Session Creation", "PASS", 
                                f"Session created successfully for user: {data['user'].get('email', 'unknown')}", response)
                else:
                    self.log_test("Auth Session Creation", "FAIL", 
                                "Response missing required fields", response)
            else:
                # This might fail due to external Emergent Auth API call
                self.log_test("Auth Session Creation", "FAIL", 
                            "Session creation failed - likely due to external API dependency", response)
            
            # Test with missing session_id
            response = self.session.post(f"{BASE_URL}/auth/session", json={})
            if response.status_code == 400:
                self.log_test("Auth Session Validation", "PASS", 
                            "Correctly rejected request without session_id", response)
            else:
                self.log_test("Auth Session Validation", "FAIL", 
                            "Should reject request without session_id", response)
                
        except Exception as e:
            self.log_test("Auth Session Endpoint", "ERROR", f"Exception: {str(e)}")
    
    def test_auth_me_endpoint(self):
        """Test /api/auth/me endpoint"""
        print("\n=== Testing Auth Me Endpoint ===")
        
        try:
            # Test without authentication
            response = self.session.get(f"{BASE_URL}/auth/me")
            if response.status_code == 401:
                self.log_test("Auth Me - Unauthenticated", "PASS", 
                            "Correctly rejected unauthenticated request", response)
            else:
                self.log_test("Auth Me - Unauthenticated", "FAIL", 
                            "Should reject unauthenticated request", response)
            
            # Test with session token (if we have one)
            if self.session_token:
                headers = {"Authorization": f"Bearer {self.session_token}"}
                response = self.session.get(f"{BASE_URL}/auth/me", headers=headers)
                if response.status_code == 200:
                    data = response.json()
                    if "id" in data and "email" in data and "role" in data:
                        self.log_test("Auth Me - Authenticated", "PASS", 
                                    f"Retrieved user profile: {data.get('email')}", response)
                    else:
                        self.log_test("Auth Me - Authenticated", "FAIL", 
                                    "Response missing required user fields", response)
                else:
                    self.log_test("Auth Me - Authenticated", "FAIL", 
                                "Failed to retrieve authenticated user", response)
            else:
                self.log_test("Auth Me - Authenticated", "SKIP", 
                            "No session token available for testing")
                
        except Exception as e:
            self.log_test("Auth Me Endpoint", "ERROR", f"Exception: {str(e)}")
    
    def test_auth_logout_endpoint(self):
        """Test /api/auth/logout endpoint"""
        print("\n=== Testing Auth Logout Endpoint ===")
        
        try:
            # Test logout
            response = self.session.post(f"{BASE_URL}/auth/logout")
            if response.status_code == 200:
                data = response.json()
                if "message" in data:
                    self.log_test("Auth Logout", "PASS", 
                                "Logout successful", response)
                else:
                    self.log_test("Auth Logout", "FAIL", 
                                "Response missing message field", response)
            else:
                self.log_test("Auth Logout", "FAIL", 
                            "Logout failed", response)
                
        except Exception as e:
            self.log_test("Auth Logout Endpoint", "ERROR", f"Exception: {str(e)}")
    
    def test_user_management_endpoints(self):
        """Test user management endpoints"""
        print("\n=== Testing User Management Endpoints ===")
        
        try:
            # Test /api/users endpoint (should require coordinator role)
            response = self.session.get(f"{BASE_URL}/users")
            if response.status_code in [401, 403]:
                self.log_test("Users List - Unauthorized", "PASS", 
                            "Correctly rejected unauthorized request", response)
            elif response.status_code == 200:
                # If somehow we have coordinator access
                data = response.json()
                if isinstance(data, list):
                    self.log_test("Users List - Authorized", "PASS", 
                                f"Retrieved {len(data)} users", response)
                else:
                    self.log_test("Users List - Authorized", "FAIL", 
                                "Response should be a list", response)
            else:
                self.log_test("Users List", "FAIL", 
                            "Unexpected response", response)
            
            # Test role update endpoint (should require coordinator role)
            test_user_id = self.test_user_id or "test-user-id"
            response = self.session.put(f"{BASE_URL}/users/{test_user_id}/role", 
                                      params={"role": "teacher"})
            if response.status_code in [401, 403]:
                self.log_test("Role Update - Unauthorized", "PASS", 
                            "Correctly rejected unauthorized role update", response)
            elif response.status_code == 200:
                self.log_test("Role Update - Authorized", "PASS", 
                            "Role update successful", response)
            else:
                self.log_test("Role Update", "FAIL", 
                            "Unexpected response", response)
            
            # Test invalid role
            response = self.session.put(f"{BASE_URL}/users/{test_user_id}/role", 
                                      params={"role": "invalid_role"})
            if response.status_code == 400:
                self.log_test("Role Update - Invalid Role", "PASS", 
                            "Correctly rejected invalid role", response)
            else:
                self.log_test("Role Update - Invalid Role", "FAIL", 
                            "Should reject invalid role", response)
                
        except Exception as e:
            self.log_test("User Management Endpoints", "ERROR", f"Exception: {str(e)}")
    
    def test_dashboard_endpoints(self):
        """Test dashboard API endpoints"""
        print("\n=== Testing Dashboard Endpoints ===")
        
        try:
            # Test progress dashboard
            response = self.session.get(f"{BASE_URL}/dashboard/progress")
            if response.status_code == 401:
                self.log_test("Progress Dashboard - Unauthenticated", "PASS", 
                            "Correctly rejected unauthenticated request", response)
            elif response.status_code == 200:
                data = response.json()
                if isinstance(data, list) and len(data) > 0:
                    # Check if mock data structure is correct
                    first_item = data[0]
                    required_fields = ["student_id", "student_name", "classroom_name", 
                                     "total_assignments", "submitted_assignments"]
                    if all(field in first_item for field in required_fields):
                        self.log_test("Progress Dashboard", "PASS", 
                                    f"Retrieved {len(data)} progress records with correct structure", response)
                    else:
                        self.log_test("Progress Dashboard", "FAIL", 
                                    "Progress data missing required fields", response)
                else:
                    self.log_test("Progress Dashboard", "FAIL", 
                                "Should return list of progress data", response)
            else:
                self.log_test("Progress Dashboard", "FAIL", 
                            "Unexpected response", response)
            
            # Test metrics dashboard
            response = self.session.get(f"{BASE_URL}/dashboard/metrics")
            if response.status_code == 401:
                self.log_test("Metrics Dashboard - Unauthenticated", "PASS", 
                            "Correctly rejected unauthenticated request", response)
            elif response.status_code == 200:
                data = response.json()
                required_fields = ["total_students", "total_teachers", "total_classes", 
                                 "overall_submission_rate", "recent_activity"]
                if all(field in data for field in required_fields):
                    self.log_test("Metrics Dashboard", "PASS", 
                                "Retrieved metrics with correct structure", response)
                else:
                    self.log_test("Metrics Dashboard", "FAIL", 
                                "Metrics data missing required fields", response)
            else:
                self.log_test("Metrics Dashboard", "FAIL", 
                            "Unexpected response", response)
            
            # Test notifications endpoint
            response = self.session.get(f"{BASE_URL}/notifications")
            if response.status_code == 401:
                self.log_test("Notifications - Unauthenticated", "PASS", 
                            "Correctly rejected unauthenticated request", response)
            elif response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    if len(data) > 0:
                        first_notif = data[0]
                        required_fields = ["id", "type", "title", "message", "timestamp"]
                        if all(field in first_notif for field in required_fields):
                            self.log_test("Notifications", "PASS", 
                                        f"Retrieved {len(data)} notifications with correct structure", response)
                        else:
                            self.log_test("Notifications", "FAIL", 
                                        "Notification data missing required fields", response)
                    else:
                        self.log_test("Notifications", "PASS", 
                                    "Retrieved empty notifications list", response)
                else:
                    self.log_test("Notifications", "FAIL", 
                                "Should return list of notifications", response)
            else:
                self.log_test("Notifications", "FAIL", 
                            "Unexpected response", response)
            
            # Test classrooms endpoint
            response = self.session.get(f"{BASE_URL}/classrooms")
            if response.status_code == 401:
                self.log_test("Classrooms - Unauthenticated", "PASS", 
                            "Correctly rejected unauthenticated request", response)
            elif response.status_code == 200:
                data = response.json()
                if isinstance(data, list):
                    if len(data) > 0:
                        first_classroom = data[0]
                        required_fields = ["id", "name", "google_classroom_id", "teacher_id"]
                        if all(field in first_classroom for field in required_fields):
                            self.log_test("Classrooms", "PASS", 
                                        f"Retrieved {len(data)} classrooms with correct structure", response)
                        else:
                            self.log_test("Classrooms", "FAIL", 
                                        "Classroom data missing required fields", response)
                    else:
                        self.log_test("Classrooms", "PASS", 
                                    "Retrieved empty classrooms list", response)
                else:
                    self.log_test("Classrooms", "FAIL", 
                                "Should return list of classrooms", response)
            else:
                self.log_test("Classrooms", "FAIL", 
                            "Unexpected response", response)
                
        except Exception as e:
            self.log_test("Dashboard Endpoints", "ERROR", f"Exception: {str(e)}")
    
    def run_all_tests(self):
        """Run all backend tests"""
        print("Starting Backend API Tests for Semillero Digital Classroom Enhancer")
        print(f"Base URL: {BASE_URL}")
        print("=" * 70)
        
        # Run tests in order
        self.test_auth_session_endpoint()
        self.test_auth_me_endpoint()
        self.test_auth_logout_endpoint()
        self.test_user_management_endpoints()
        self.test_dashboard_endpoints()
        
        # Calculate overall status
        all_tests = {}
        for category in self.results:
            if category != "overall_status":
                all_tests.update(self.results[category])
        
        failed_tests = [name for name, result in all_tests.items() 
                       if result["status"] in ["FAIL", "ERROR"]]
        passed_tests = [name for name, result in all_tests.items() 
                       if result["status"] == "PASS"]
        skipped_tests = [name for name, result in all_tests.items() 
                        if result["status"] == "SKIP"]
        
        print("\n" + "=" * 70)
        print("BACKEND TEST SUMMARY")
        print("=" * 70)
        print(f"Total Tests: {len(all_tests)}")
        print(f"Passed: {len(passed_tests)}")
        print(f"Failed: {len(failed_tests)}")
        print(f"Skipped: {len(skipped_tests)}")
        
        if failed_tests:
            print(f"\nFailed Tests:")
            for test in failed_tests:
                result = all_tests[test]
                print(f"  - {test}: {result['message']}")
        
        if skipped_tests:
            print(f"\nSkipped Tests:")
            for test in skipped_tests:
                result = all_tests[test]
                print(f"  - {test}: {result['message']}")
        
        # Determine overall status
        if len(failed_tests) == 0:
            self.results["overall_status"] = "PASS"
            print(f"\n✅ OVERALL STATUS: PASS")
        else:
            self.results["overall_status"] = "FAIL"
            print(f"\n❌ OVERALL STATUS: FAIL")
        
        return self.results

if __name__ == "__main__":
    tester = BackendTester()
    results = tester.run_all_tests()
    
    # Exit with appropriate code
    sys.exit(0 if results["overall_status"] == "PASS" else 1)