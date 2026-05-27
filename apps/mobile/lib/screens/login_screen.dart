import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';

import 'package:classifly/theme.dart';

class LoginScreen extends StatefulWidget {
  const LoginScreen({super.key});

  @override
  State<LoginScreen> createState() => _LoginScreenState();
}

class _LoginScreenState extends State<LoginScreen> {
  final _phoneCtl = TextEditingController(text: '+91');

  @override
  void dispose() {
    _phoneCtl.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: SafeArea(
        child: Padding(
          padding: const EdgeInsets.symmetric(horizontal: 24),
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.stretch,
            children: [
              const SizedBox(height: 48),
              RichText(
                textAlign: TextAlign.center,
                text: const TextSpan(
                  style: TextStyle(
                    fontWeight: FontWeight.w800,
                    fontSize: 28,
                    color: AppColors.primary,
                  ),
                  children: [
                    TextSpan(text: 'Classifly'),
                    TextSpan(text: '.in', style: TextStyle(color: AppColors.accent)),
                  ],
                ),
              ),
              const SizedBox(height: 32),
              const Text(
                'Welcome back',
                style: TextStyle(fontSize: 20, fontWeight: FontWeight.w700),
                textAlign: TextAlign.center,
              ),
              const SizedBox(height: 4),
              const Text(
                "Sign in with your mobile number. We'll send a 6-digit OTP.",
                textAlign: TextAlign.center,
                style: TextStyle(color: AppColors.neutral500),
              ),
              const SizedBox(height: 32),
              TextField(
                controller: _phoneCtl,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Mobile number',
                  prefixIcon: Icon(Icons.phone),
                ),
              ),
              const SizedBox(height: 16),
              ElevatedButton(
                onPressed: () {
                  // TODO: wire to Supabase auth
                  ScaffoldMessenger.of(context).showSnackBar(
                    const SnackBar(content: Text('OTP flow not wired yet — see TODO')),
                  );
                  context.go('/');
                },
                child: const Text('Send OTP'),
              ),
              const Spacer(),
              const Padding(
                padding: EdgeInsets.only(bottom: 24),
                child: Text(
                  'By continuing you agree to the Terms and Privacy Policy.',
                  textAlign: TextAlign.center,
                  style: TextStyle(fontSize: 12, color: AppColors.neutral500),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
