package com.dongfangsodu.ods.api;

import java.util.List;

public record PageResponse<T>(List<T> items, int page, int size, long total, int totalPages) {
}
