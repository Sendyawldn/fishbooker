<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

class EnsureUserIsAdmin
{
    /**
     * Handle an incoming request.
     */
    public function handle(Request $request, Closure $next): Response|JsonResponse
    {
        $user = $request->user();

        if (! $user || $user->role !== 'ADMIN') {
            return response()->json([
                'message' => 'Akses ditolak. Hanya admin yang dapat melakukan aksi ini.',
            ], 403);
        }

        return $next($request);
    }
}
