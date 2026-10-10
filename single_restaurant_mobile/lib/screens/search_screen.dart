import 'package:flutter/material.dart';
import 'package:provider/provider.dart';
import 'package:single_restaurant_mobile/providers/search_provider.dart';
import 'package:single_restaurant_mobile/theme/app_responsive.dart';
import 'package:single_restaurant_mobile/widgets/common/responsive_center.dart';
import 'package:single_restaurant_mobile/widgets/search/search_results_view.dart';
import 'package:single_restaurant_mobile/widgets/search/search_suggestions.dart';

class SearchScreen extends StatefulWidget {
  const SearchScreen({super.key});

  @override
  State<SearchScreen> createState() => _SearchScreenState();
}

class _SearchScreenState extends State<SearchScreen> {
  final TextEditingController _searchController = TextEditingController();
  final FocusNode _searchFocusNode = FocusNode();
  String _currentQuery = '';

  @override
  void initState() {
    super.initState();
    WidgetsBinding.instance.addPostFrameCallback((_) {
      _searchFocusNode.requestFocus();
    });
  }

  @override
  void dispose() {
    _searchController.dispose();
    _searchFocusNode.dispose();
    super.dispose();
  }

  void _onSearchSubmit(String query) {
    if (query.trim().isEmpty) return;
    setState(() => _currentQuery = query.trim());
    Provider.of<SearchProvider>(context, listen: false).search(query);
  }

  void _onRecentSearchTap(String query) {
    _searchController.text = query;
    _searchController.selection =
        TextSelection.fromPosition(TextPosition(offset: query.length));
    _onSearchSubmit(query);
  }

  Widget _buildSearchBar(BuildContext context, SearchProvider searchProvider) {
    return Padding(
      padding: const EdgeInsets.fromLTRB(4, 8, 12, 8),
      child: Row(
        children: [
          IconButton(
            padding: EdgeInsets.zero,
            constraints: const BoxConstraints(minWidth: 40, minHeight: 40),
            icon: const Icon(Icons.arrow_back, color: Colors.red),
            onPressed: () {
              searchProvider.clearSearch();
              Navigator.pop(context);
            },
          ),
          Expanded(
            child: Container(
              constraints: const BoxConstraints(minHeight: 44),
              decoration: BoxDecoration(
                color: Colors.grey.shade200,
                borderRadius: BorderRadius.circular(12),
              ),
              child: Center(
                child: TextField(
                  controller: _searchController,
                  focusNode: _searchFocusNode,
                  textInputAction: TextInputAction.search,
                  onSubmitted: _onSearchSubmit,
                  onChanged: (val) {
                    if (val.isEmpty && _currentQuery.isNotEmpty) {
                      setState(() => _currentQuery = '');
                      searchProvider.clearSearch();
                    }
                  },
                  decoration: InputDecoration(
                    hintText: 'Search dishes...',
                    hintStyle: TextStyle(color: Colors.grey.shade600),
                    prefixIcon: const Icon(Icons.search, color: Colors.grey),
                    suffixIcon: _searchController.text.isNotEmpty
                        ? IconButton(
                            icon: const Icon(Icons.close,
                                size: 20, color: Colors.grey),
                            onPressed: () {
                              _searchController.clear();
                              setState(() => _currentQuery = '');
                              searchProvider.clearSearch();
                            },
                          )
                        : null,
                    border: InputBorder.none,
                    isDense: true,
                    contentPadding: const EdgeInsets.symmetric(
                        vertical: 10, horizontal: 8),
                  ),
                ),
              ),
            ),
          ),
          const SizedBox(width: 8),
          GestureDetector(
            onTap: () {
              _searchController.clear();
              setState(() => _currentQuery = '');
              searchProvider.clearSearch();
              Navigator.pop(context);
            },
            child: const FittedBox(
              fit: BoxFit.scaleDown,
              child: Text(
                'Cancel',
                style: TextStyle(
                  color: Colors.red,
                  fontWeight: FontWeight.w600,
                  fontSize: 15,
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  @override
  Widget build(BuildContext context) {
    final searchProvider = Provider.of<SearchProvider>(context);

    return Scaffold(
      backgroundColor: const Color(0xFFFCF9F2),
      body: SafeArea(
        child: ResponsiveCenter(
          maxWidth: AppResponsive.maxContentWidth,
          child: Column(
            children: [
              _buildSearchBar(context, searchProvider),
              Expanded(
                child: _currentQuery.isNotEmpty || searchProvider.isLoading
                    ? SearchResultsView(
                        query: _currentQuery,
                        searchProvider: searchProvider,
                      )
                    : SearchSuggestions(
                        searchProvider: searchProvider,
                        onSearchTap: _onRecentSearchTap,
                      ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
