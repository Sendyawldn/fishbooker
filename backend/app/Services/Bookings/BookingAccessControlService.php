<?php

namespace App\Services\Bookings;

use App\Models\Booking;
use App\Models\OperationalSetting;
use App\Models\User;
use Illuminate\Contracts\Pagination\LengthAwarePaginator;

class BookingAccessControlService
{
    private const BOOKINGS_ENABLED_KEY = 'bookings_enabled';

    private const MAX_ACTIVE_HOLDS_KEY = 'max_active_holds_per_user';

    /**
     * @return array{
     *     bookings_enabled: bool,
     *     max_active_holds_per_user: int
     * }
     */
    public function getControls(): array
    {
        return [
            'bookings_enabled' => $this->bookingsEnabled(),
            'max_active_holds_per_user' => $this->maxActiveHoldsPerUser(),
        ];
    }

    /**
     * @param  array{bookings_enabled?: bool, max_active_holds_per_user?: int}  $attributes
     * @return array{
     *     bookings_enabled: bool,
     *     max_active_holds_per_user: int
     * }
     */
    public function updateControls(array $attributes, User $adminUser): array
    {
        if (array_key_exists('bookings_enabled', $attributes)) {
            $this->putSetting(
                self::BOOKINGS_ENABLED_KEY,
                ($attributes['bookings_enabled'] ?? true) ? '1' : '0',
                $adminUser->id,
            );
        }

        if (array_key_exists('max_active_holds_per_user', $attributes)) {
            $this->putSetting(
                self::MAX_ACTIVE_HOLDS_KEY,
                (string) ($attributes['max_active_holds_per_user'] ?? 2),
                $adminUser->id,
            );
        }

        return $this->getControls();
    }

    public function paginateCustomers(array $filters = []): LengthAwarePaginator
    {
        $search = isset($filters['search']) && is_string($filters['search'])
            ? trim($filters['search'])
            : null;
        $perPage = isset($filters['per_page']) && is_numeric($filters['per_page'])
            ? max((int) $filters['per_page'], 1)
            : 15;

        return User::query()
            ->where('role', 'PELANGGAN')
            ->when($search, function ($query, string $search): void {
                $query->where(function ($searchQuery) use ($search): void {
                    $searchQuery
                        ->where('name', 'like', "%{$search}%")
                        ->orWhere('email', 'like', "%{$search}%");
                });
            })
            ->withCount([
                'bookings as active_pending_bookings_count' => function ($query): void {
                    $query
                        ->where('status', 'PENDING')
                        ->where(function ($pendingQuery): void {
                            $pendingQuery
                                ->whereNull('expires_at')
                                ->orWhere('expires_at', '>', now());
                        });
                },
                'bookings as successful_bookings_count' => function ($query): void {
                    $query->where('status', 'SUCCESS');
                },
                'bookings as cancelled_bookings_count' => function ($query): void {
                    $query->where('status', 'CANCELLED');
                },
            ])
            ->orderByDesc('updated_at')
            ->orderBy('name')
            ->paginate(min($perPage, 50));
    }

    /**
     * @param  array{is_booking_blocked: bool, booking_block_reason?: ?string}  $attributes
     */
    public function updateCustomerAccess(User $customer, array $attributes): User
    {
        $customer->forceFill([
            'is_booking_blocked' => $attributes['is_booking_blocked'],
            'booking_block_reason' => $attributes['is_booking_blocked']
                ? ($attributes['booking_block_reason'] ?? null)
                : null,
        ])->save();

        return $customer->fresh();
    }

    /**
     * @return array{
     *     allowed: bool,
     *     error: ?string,
     *     message: ?string,
     *     status: int,
     *     context: array<string, mixed>
     * }
     */
    public function evaluateBookingAccessForUser(User $user): array
    {
        if (! $this->bookingsEnabled()) {
            return [
                'allowed' => false,
                'error' => 'BOOKING_DISABLED',
                'message' => 'Reservasi sedang dihentikan sementara oleh admin.',
                'status' => 503,
                'context' => [],
            ];
        }

        if ((bool) $user->is_booking_blocked) {
            return [
                'allowed' => false,
                'error' => 'BOOKING_BLOCKED',
                'message' => $user->booking_block_reason
                    ?: 'Akun Anda sedang dibatasi untuk membuat booking baru.',
                'status' => 403,
                'context' => [],
            ];
        }

        $activePendingBookings = $this->countActivePendingBookingsForUser($user->id);
        $limit = $this->maxActiveHoldsPerUser();

        if ($activePendingBookings >= $limit) {
            return [
                'allowed' => false,
                'error' => 'BOOKING_LIMIT_REACHED',
                'message' => 'Anda sudah mencapai batas hold booking aktif.',
                'status' => 422,
                'context' => [
                    'active_pending_bookings' => $activePendingBookings,
                    'max_active_holds_per_user' => $limit,
                ],
            ];
        }

        return [
            'allowed' => true,
            'error' => null,
            'message' => null,
            'status' => 200,
            'context' => [
                'active_pending_bookings' => $activePendingBookings,
                'max_active_holds_per_user' => $limit,
            ],
        ];
    }

    public function bookingsEnabled(): bool
    {
        return $this->getSetting(self::BOOKINGS_ENABLED_KEY, '1') === '1';
    }

    public function maxActiveHoldsPerUser(): int
    {
        return max((int) $this->getSetting(self::MAX_ACTIVE_HOLDS_KEY, '2'), 1);
    }

    public function countActivePendingBookingsForUser(int $userId): int
    {
        return Booking::query()
            ->where('user_id', $userId)
            ->where('status', 'PENDING')
            ->where(function ($query): void {
                $query
                    ->whereNull('expires_at')
                    ->orWhere('expires_at', '>', now());
            })
            ->count();
    }

    private function getSetting(string $key, string $default): string
    {
        $setting = OperationalSetting::query()->find($key);

        if (! $setting || $setting->value === null || $setting->value === '') {
            return $default;
        }

        return $setting->value;
    }

    private function putSetting(string $key, string $value, int $updatedBy): void
    {
        OperationalSetting::query()->updateOrCreate(
            ['key' => $key],
            [
                'value' => $value,
                'updated_by' => $updatedBy,
            ],
        );
    }
}
