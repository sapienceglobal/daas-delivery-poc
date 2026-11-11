import 'dart:io';

class HttpException implements Exception {
  final String message;
  HttpException(this.message);
  @override
  String toString() => message;
}

void testCatch() {
  try {
    throw HttpException('Custom error message');
  } on HttpException catch (e) {
    print('Caught in on HttpException: ${e.message}');
  } catch (error) {
    print('Caught in catch (error): $error');
  }
}

void main() {
  testCatch();
}

