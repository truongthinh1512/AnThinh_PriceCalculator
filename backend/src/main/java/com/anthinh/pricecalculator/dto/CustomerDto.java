package com.anthinh.pricecalculator.dto;

import lombok.Data;

@Data
public class CustomerDto {
    private Long id;
    private String name;
    private String phoneNumber;
    private String address;
    private String note;
}
