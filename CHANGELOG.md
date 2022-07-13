# Changelog
All notable changes to this project will be documented in this file.

## [0.1.3](https://github.com/iritechnology/receiptstar-order-scraping-sdk-api/tree/v0.1.3)
### Added
- Scrapper configuration API
- Configuration for start_date & date interval
- Validation to remove duplicate orders on upload API
- Validation based on interval configured

## [0.1.2](https://github.com/iritechnology/receiptstar-order-scraping-sdk-api/tree/v0.1.2)
### Added
- API exception handling for global errors
- Seed Attributes API for PII
- Order History upload Stream based API
- Integrated with IRI Authentication
- Configuration to switch between authentication

### Changed
- Removed JWT token auth as default guard

## [0.1.1](https://github.com/iritechnology/receiptstar-order-scraping-sdk-api/tree/v0.1.1)
### Added
- File Upload API routing
- Store File in file system
- New module for PII & Date Range API
- Date Range API
- Configured JWT Auth token for authentication 

### Changed
- Updated panelist_id & amazon_id in orderHistory schema

## [0.1.0](https://github.com/iritechnology/receiptstar-order-scraping-sdk-api/tree/v0.1.0)
### Added
- Base Setup nestjs framework.
- Base Setup unit test framework.
- Integrate PostgreSQL database with the application (Installation & Setup of DB drivers)
- Skeleton for file upload API