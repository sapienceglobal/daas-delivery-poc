import 'package:flutter/material.dart';
import 'package:flutter_svg/flutter_svg.dart';
import 'package:single_restaurant_mobile/screens/delivery_partners_screen.dart';

class HomeDeliveryPartners extends StatelessWidget {
  const HomeDeliveryPartners({super.key});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(horizontal: 16.0),
      child: GestureDetector(
        onTap: () {
          Navigator.push(
            context,
            MaterialPageRoute(
              builder: (context) => const DeliveryPartnersScreen(),
            ),
          );
        },
        child: Container(
          padding: const EdgeInsets.symmetric(vertical: 14.0, horizontal: 8.0),
          decoration: BoxDecoration(
            borderRadius: BorderRadius.circular(14),
            border: Border.all(color: const Color(0xFFE5E5E5), width: 1.0),
            color: Colors.white,
            boxShadow: [
              BoxShadow(
                color: Colors.black.withValues(alpha: 0.03),
                blurRadius: 6,
                offset: const Offset(0, 2),
              ),
            ],
          ),
          child: Column(
            children: [
              const Row(
                mainAxisAlignment: MainAxisAlignment.center,
                children: [
                  Icon(
                    Icons.moped,
                    size: 15,
                    color: Color(0xFF757575),
                  ),
                  SizedBox(width: 6),
                  Text(
                    'DELIVERING WITH',
                    style: TextStyle(
                      color: Color(0xFF757575),
                      fontWeight: FontWeight.w700,
                      fontSize: 10.5,
                      letterSpacing: 0.8,
                    ),
                  ),
                ],
              ),
              const SizedBox(height: 12),
              Row(
                mainAxisAlignment: MainAxisAlignment.spaceEvenly,
                children: [
                  const Expanded(
                    child: Center(
                      child: Column(
                        mainAxisSize: MainAxisSize.min,
                        children: [
                          Text(
                            'Uber',
                            style: TextStyle(
                              color: Colors.black,
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              height: 1.05,
                            ),
                          ),
                          Text(
                            'Eats',
                            style: TextStyle(
                              color: Color(0xFF06C167),
                              fontSize: 15,
                              fontWeight: FontWeight.bold,
                              height: 1.05,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ),
                  Container(
                    height: 36,
                    width: 1,
                    color: const Color(0xFFE8E8E8),
                  ),
                  Expanded(
                    child: Column(
                      mainAxisSize: MainAxisSize.min,
                      children: [
                        SvgPicture.string('''
                          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="28" height="18">
                            <path d="M23.38 8.87a6.25 6.25 0 0 0-4.88-2.31H.69a.66.66 0 0 0-.66.66v2.18a.66.66 0 0 0 .66.66h17.81a1.9 1.9 0 0 1 1.48.69 1.84 1.84 0 0 1 .43 1.54 1.86 1.86 0 0 1-1.39 1.48 2 2 0 0 1-1.74-.29.66.66 0 0 0-.89 1.02 4.19 4.19 0 0 0 2.59 1.07 4.23 4.23 0 0 0 3.23-1.44 4.17 4.17 0 0 0 .97-3.41 4.18 4.18 0 0 0-2.8-3.07z" fill="#FF3008"/>
                            <path d="M12.92 13.91H.69a.66.66 0 0 0-.66.66v2.18a.66.66 0 0 0 .66.66h12.23a.66.66 0 0 0 .66-.66v-2.18a.66.66 0 0 0-.66-.66z" fill="#FF3008"/>
                          </svg>
                        '''),
                        const SizedBox(height: 3),
                        const Text(
                          'DOORDASH',
                          style: TextStyle(
                            color: Color(0xFFFF3008),
                            fontSize: 10,
                            fontWeight: FontWeight.w900,
                            letterSpacing: 0.4,
                          ),
                        ),
                      ],
                    ),
                  ),
                  Container(
                    height: 36,
                    width: 1,
                    color: const Color(0xFFE8E8E8),
                  ),
                  const Expanded(
                    child: Center(
                      child: Text(
                        'GRUBHUB',
                        style: TextStyle(
                          color: Color(0xFFEA5A27),
                          fontSize: 16,
                          fontWeight: FontWeight.w900,
                          letterSpacing: -0.3,
                        ),
                      ),
                    ),
                  ),
                ],
              ),
            ],
          ),
        ),
      ),
    );
  }
}
