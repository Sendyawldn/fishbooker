<?php

namespace App\Http\Requests\Api;

use Illuminate\Foundation\Http\FormRequest;
use Illuminate\Validation\Rule;

class StoreSlotRequest extends FormRequest
{
    /**
     * Determine if the user is authorized to make this request.
     */
    public function authorize(): bool
    {
        return true;
    }

    /**
     * Get the validation rules that apply to the request.
     *
     * @return array<string, mixed>
     */
    public function rules(): array
    {
        return [
            'slot_number' => ['required', 'integer', 'min:1', 'unique:slots,slot_number'],
            'price' => ['required', 'integer', 'min:0'],
            'status' => ['nullable', Rule::in(['TERSEDIA', 'DIBOOKING', 'PERBAIKAN'])],
        ];
    }
}
