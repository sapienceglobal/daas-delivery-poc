import 'dart:convert';
import 'dart:io';

void main() async {
  final client = HttpClient();
  final uri = Uri.parse('https://api.lassiloungeny.com/api/auth/login');
  final body = json.encode({
    'email': 'tester@lassilounge.com',
    'password': 'wrongpassword',
    'rememberMe': true,
  });

  try {
    final request = await client.postUrl(uri);
    request.headers.set('Content-Type', 'application/json');
    request.headers.set('Accept', 'application/json');
    request.headers.set('x-tenant-id', 'lassi-lounge');
    request.headers.set('x-app-secret', 'mobile_app_secure_key_2026');
    request.headers.set('x-platform', 'customer_app');
    request.headers.set('x-device-os', 'iOS');
    request.headers.set('x-device-os-version', '17.5');
    request.write(body);

    final response = await request.close();
    print('Status: ${response.statusCode}');
    final resBody = await response.transform(utf8.decoder).join();
    print('Body: $resBody');
  } catch (e) {
    print('Error: $e');
  } finally {
    client.close();
  }
}
